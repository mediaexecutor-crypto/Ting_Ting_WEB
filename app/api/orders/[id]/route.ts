import { NextResponse } from 'next/server';
import { updateOrder } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const body = await request.json();

  const { data: order, error: findError } = await supabaseAdmin
    .from('orders')
    .select('customer_id')
    .eq('id', orderId)
    .maybeSingle();

  if (findError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  try {
    await updateOrder(orderId, order.customer_id, body);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: `Invoice "${body.invoice}" already exists. Use a different invoice number.` },
        { status: 409 }
      );
    }
    console.error('Order update failed:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
