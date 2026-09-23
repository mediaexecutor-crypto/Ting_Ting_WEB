import { supabaseAdmin } from './supabaseAdmin';
import { findOrCreateCustomer } from './customers';
import { NewOrderPayload, Order, OrderStatus } from './types';

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      total_amount,
      due_amount,
      status,
      customers (
        name,
        phone
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
    delivery: order.delivery_date,
    amount: Number(order.total_amount ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
  }));
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

  return order.id as string;
}
