import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { status } = await request.json();

  const { data: order, error: findError } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id')
    .eq('id', orderId)
    .maybeSingle();

  if (findError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const ctx = await getCurrentUserContext();
  if (order.salesperson_id && order.salesperson_id !== ctx?.id) {
    return NextResponse.json({ error: 'Not authorized to edit this order.' }, { status: 403 });
  }

  try {
    await updateOrderStatus(orderId, status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Status update failed:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
