import { supabaseAdmin } from './supabaseAdmin';
import { findOrCreateCustomer } from './customers';
import { getOrCreateOrderFolder } from './orderFolders';
import { NewOrderPayload, Order, OrderStatus } from './types';

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      order_date,
      source,
      total_amount,
      due_amount,
      status,
      customers (
        name,
        phone,
        address
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }

  return (data ?? []).map((order: any) => ({
    id: order.id,
    invoice: order.invoice,
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
  }));
}

// Orders still awaiting delivery (excludes DELIVERED / CANCELLED),
// soonest delivery date first.
export async function getPendingDeliveries(): Promise<Order[]> {
  const orders = await getOrders();
  return orders
    .filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
    .sort((a, b) => (a.delivery || '9999').localeCompare(b.delivery || '9999'));
}

export type OrderDetail = Order & {
  items: { id: string; product: string; qty: number; price: number }[];
  notes: string;
};

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      order_date,
      source,
      total_amount,
      due_amount,
      status,
      notes,
      customers ( name, phone, address ),
      order_items ( id, product_name, quantity, unit_price )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch order detail:', error);
    throw error;
  }

  if (!data) return null;

  const order: any = data;

  return {
    id: order.id,
    invoice: order.invoice,
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
    notes: order.notes ?? '',
    items: (order.order_items ?? []).map((it: any) => ({
      id: it.id,
      product: it.product_name,
      qty: it.quantity,
      price: Number(it.unit_price ?? 0),
    })),
  };
}

export async function createOrder(payload: NewOrderPayload) {
  const customerId = await findOrCreateCustomer(
    payload.customerName,
    payload.phone,
    payload.address
  );

  const totalAmount = payload.items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      invoice: payload.invoice,
      customer_id: customerId,
      delivery_date: payload.deliveryDate || null,
      source: payload.source,
      priority: payload.priority,
      status: 'NEW',
      total_amount: totalAmount,
      advance: payload.advance,
      due_amount: payload.due,
      notes: payload.notes,
    })
    .select('id')
    .single();

  if (orderError) {
    console.error('Failed to create order:', orderError);
    throw orderError;
  }

  const items = payload.items
    .filter((item) => item.product.trim() !== '')
    .map((item) => ({
      order_id: order.id,
      product_name: item.product,
      quantity: item.qty,
      unit_price: item.price,
    }));

  if (items.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(items);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      throw itemsError;
    }
  }

  // Best-effort: create the order's Drive folder if a Google account is
  // connected. Never let a Drive hiccup fail the order itself — the
  // folder can also be created lazily on first file upload.
  try {
    await getOrCreateOrderFolder(order.id, `${payload.customerName} - ${payload.phone}`);
  } catch (err) {
    console.error('Order created, but Drive folder creation failed:', err);
  }

  return order.id as string;
}
