import { NextResponse } from 'next/server';
import { saveExistingOdooLink } from '@/lib/odoo';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { url } = await request.json();

  if (!url || !String(url).trim()) {
    return NextResponse.json({ error: 'Paste a link first.' }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('customer_id, salesperson_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

  const ctx = await getCurrentUserContext();
  if (order.salesperson_id && order.salesperson_id !== ctx?.id) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await saveExistingOdooLink(order.customer_id, String(url).trim());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save link.' }, { status: 500 });
  }
}
