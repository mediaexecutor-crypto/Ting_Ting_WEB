import { NextResponse } from 'next/server';
import { updateOrderCourier } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { courier } = await request.json();

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const ctx = await getCurrentUserContext();
  if (order.salesperson_id && order.salesperson_id !== ctx?.id) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await updateOrderCourier(orderId, courier);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}
