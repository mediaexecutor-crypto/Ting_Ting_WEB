import { NextResponse } from 'next/server';
import { getOrCreateShareToken } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

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
    const token = await getOrCreateShareToken(orderId);
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    return NextResponse.json({ url: `${origin}/share/${token}` });
  } catch {
    return NextResponse.json({ error: 'Failed to create share link.' }, { status: 500 });
  }
}
