import { supabase } from './supabase';
import { Order, OrderStatus } from './types';

export async function getOrders(): Promise<Order[]> {
console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE KEY EXISTS:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  throw new Error('ORDERS_FUNCTION_REACHED');
  
  const { data, error } = await supabase
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
