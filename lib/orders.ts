import { supabaseAdmin } from './supabaseAdmin';
import { findOrCreateCustomer } from './customers';
import { getOrCreateOrderFolder } from './orderFolders';
import { NewOrderPayload, Order, OrderStatus } from './types';

export async function getOrders(salespersonId?: string): Promise<Order[]> {
  let query = supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      order_date,
      source,
      total_amount,
      delivery_charge,
      advance,
      due_amount,
      status,
      salesperson_id,
      customers (
        name,
        phone,
        address
      )
    `)
    .order('created_at', { ascending: false });

  if (salespersonId) {
    query = query.eq('salesperson_id', salespersonId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }

  return (data ?? []).map((order: any) => ({
    id: order.id,
    invoice: order.invoice ?? '',
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    deliveryCharge: Number(order.delivery_charge ?? 0),
    advance: Number(order.advance ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
    salespersonId: order.salesperson_id ?? null,
  }));
}

// Orders still awaiting delivery (excludes DELIVERED / CANCELLED),
// soonest delivery date first.
export async function getPendingDeliveries(salespersonId?: string): Promise<Order[]> {
  const orders = await getOrders(salespersonId);
  return orders
    .filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
    .sort((a, b) => (a.delivery || '9999').localeCompare(b.delivery || '9999'));
}

// The Deliveries page specifically: only orders that have actually
// reached the delivery stage (READY/DELIVERY/DELIVERED) — a product
// still being designed or produced shouldn't show up here.
export async function getDeliveryQueue(salespersonId?: string): Promise<Order[]> {
  const orders = await getOrders(salespersonId);
  const relevant: OrderStatus[] = ['READY', 'DELIVERY', 'DELIVERED'];
  return orders
    .filter((o) => relevant.includes(o.status))
    .sort((a, b) => (a.delivery || '9999').localeCompare(b.delivery || '9999'));
}

export type OrderDetail = Order & {
  customerId: string;
  items: { id: string; product: string; qty: number; price: number }[];
  notes: string;
  confirmedDate: string;
  productNotes: string;
};

// Returns the order's salesperson_id only (cheap check used to enforce
// per-salesperson visibility before rendering/editing an order).
export async function getOrderOwner(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id')
    .eq('id', id)
    .maybeSingle();
  return data?.salesperson_id ?? null;
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      order_date,
      confirmed_date,
      source,
      total_amount,
      delivery_charge,
      advance,
      due_amount,
      status,
      notes,
      product_notes,
      customer_id,
      salesperson_id,
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
    customerId: order.customer_id,
    invoice: order.invoice ?? '',
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    confirmedDate: order.confirmed_date ?? '',
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    deliveryCharge: Number(order.delivery_charge ?? 0),
    advance: Number(order.advance ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
    salespersonId: order.salesperson_id ?? null,
    notes: order.notes ?? '',
    productNotes: order.product_notes ?? '',
    items: (order.order_items ?? []).map((it: any) => ({
      id: it.id,
      product: it.product_name,
      qty: it.quantity,
      price: Number(it.unit_price ?? 0),
    })),
  };
}

export type UpdateOrderPayload = {
  customerName: string;
  phone: string;
  address: string;
  invoice: string;
  deliveryDate: string;
  confirmedDate: string;
  source: string;
  priority: string;
  status: OrderStatus;
  items: { product: string; qty: number; price: number }[];
  deliveryCharge: number;
  advance: number;
  productNotes: string;
  notes: string;
};

export async function updateOrder(orderId: string, customerId: string, payload: UpdateOrderPayload) {
  const { error: customerError } = await supabaseAdmin
    .from('customers')
    .update({
      name: payload.customerName.trim() || 'Unnamed Customer',
      phone: payload.phone.trim(),
      address: payload.address,
    })
    .eq('id', customerId);

  if (customerError) {
    console.error('Failed to update customer:', customerError);
    throw customerError;
  }

  const itemsTotal = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const deliveryCharge = payload.deliveryCharge || 0;
  const advance = payload.advance || 0;
  const dueAmount = itemsTotal + deliveryCharge - advance;
  const invoice = payload.invoice.trim().slice(0, 6) || null;

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      invoice,
      delivery_date: payload.deliveryDate || null,
      confirmed_date: payload.confirmedDate || null,
      source: payload.source,
      priority: payload.priority,
      status: payload.status,
      total_amount: itemsTotal,
      delivery_charge: deliveryCharge,
      advance,
      due_amount: dueAmount,
      product_notes: payload.productNotes,
      notes: payload.notes,
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Failed to update order:', orderError);
    throw orderError;
  }

  // Simplest correct way to handle add/remove/edit of line items together:
  // replace the whole set rather than diffing.
  const { error: deleteItemsError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (deleteItemsError) {
    console.error('Failed to clear old order items:', deleteItemsError);
    throw deleteItemsError;
  }

  const items = payload.items
    .filter((item) => item.product.trim() !== '')
    .map((item) => ({
      order_id: orderId,
      product_name: item.product,
      quantity: item.qty,
      unit_price: item.price,
    }));

  if (items.length > 0) {
    const { error: insertItemsError } = await supabaseAdmin.from('order_items').insert(items);
    if (insertItemsError) {
      console.error('Failed to save order items:', insertItemsError);
      throw insertItemsError;
    }
  }
}

export async function createOrder(payload: NewOrderPayload, salespersonId: string | null) {
  const customerId = await findOrCreateCustomer(
    payload.customerName,
    payload.phone,
    payload.address
  );

  const itemsTotal = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const deliveryCharge = payload.deliveryCharge || 0;
  const advance = payload.advance || 0;
  const dueAmount = itemsTotal + deliveryCharge - advance;

  // Invoice is optional and capped at 6 characters. Left blank, it's
  // stored as NULL (not an empty string or an auto-generated value) so
  // multiple no-invoice orders don't collide with the unique constraint
  // — Postgres allows any number of NULLs in a unique column.
  const trimmedInvoice = payload.invoice.trim().slice(0, 6);
  const invoice = trimmedInvoice || null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      invoice,
      customer_id: customerId,
      delivery_date: payload.deliveryDate || null,
      source: payload.source,
      priority: payload.priority,
      status: 'NEW',
      total_amount: itemsTotal,
      delivery_charge: deliveryCharge,
      advance,
      due_amount: dueAmount,
      notes: payload.notes,
      salesperson_id: salespersonId,
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
    const folderName = [payload.customerName.trim(), payload.phone.trim()]
      .filter(Boolean)
      .join(' - ') || `Order ${order.id.slice(0, 8)}`;
    await getOrCreateOrderFolder(order.id, folderName);
  } catch (err) {
    console.error('Order created, but Drive folder creation failed:', err);
  }

  return order.id as string;
}
