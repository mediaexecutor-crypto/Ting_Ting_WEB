import { NextResponse } from 'next/server';
import { ensureOdooContact } from '@/lib/odoo';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const ctx = await getCurrentUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('customer_id, salesperson_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.salesperson_id && order.salesperson_id !== ctx.id) {
    return NextResponse.json({ error: 'Not authorized for this order.' }, { status: 403 });
  }

  try {
    const { url } = await ensureOdooContact(order.customer_id);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Odoo contact creation failed:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create Odoo contact.' },
      { status: 400 }
    );
  }
}
