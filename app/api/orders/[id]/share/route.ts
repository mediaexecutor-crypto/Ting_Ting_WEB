import { NextResponse } from 'next/server';
import { getOrCreateShareToken } from '@/lib/orders';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';
import { getValidAccessToken } from '@/lib/googleAccount';
import { makeFilePublic } from '@/lib/googleDrive';

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
    // Sharing means outsiders must be able to see the files, so make every
    // existing file on this order viewable by link (covers files uploaded
    // before uploads did this automatically). Best-effort per file.
    const { data: files } = await supabaseAdmin
      .from('order_files')
      .select('drive_file_id, google_account_id')
      .eq('order_id', orderId);
    const tokens = new Map<string, string>();
    for (const f of files ?? []) {
      if (!f.drive_file_id || !f.google_account_id) continue;
      try {
        let t = tokens.get(f.google_account_id);
        if (!t) {
          t = await getValidAccessToken(f.google_account_id);
          tokens.set(f.google_account_id, t);
        }
        await makeFilePublic(t, f.drive_file_id);
      } catch (err) {
        console.error('Could not make file public:', err);
      }
    }

    const token = await getOrCreateShareToken(orderId);
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;
    return NextResponse.json({ url: `${origin}/share/${token}` });
  } catch {
    return NextResponse.json({ error: 'Failed to create share link.' }, { status: 500 });
  }
}
