import { NextResponse } from 'next/server';
import { getOrCreateOrderFolder } from '@/lib/orderFolders';
import { getValidAccessToken } from '@/lib/googleAccount';
import { initResumableUpload } from '@/lib/googleDrive';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

// Step 1 of a direct-to-Drive upload: make sure the order's folder
// exists, start a resumable session, and return only the session URL.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const body = await request.json();

  const originalName = String(body.originalName ?? 'file');
  const rename = String(body.name ?? '').trim();
  const mimeType = String(body.mimeType || 'application/octet-stream');
  const size = Number(body.size) || 0;

  const ctx = await getCurrentUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id, customers ( name, phone )')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.salesperson_id && order.salesperson_id !== ctx.id) {
    return NextResponse.json({ error: 'Not authorized for this order.' }, { status: 403 });
  }

  const customer: any = order.customers;
  const folderName =
    [customer?.name?.trim(), customer?.phone?.trim()].filter(Boolean).join(' - ') ||
    `Order ${orderId}`;

  try {
    const folder = await getOrCreateOrderFolder(orderId, folderName, ctx.id);
    if (!folder) {
      return NextResponse.json(
        { error: 'No Google Drive account connected yet. Connect it on the Drive page first.' },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(folder.googleAccountId);
    const extMatch = originalName.match(/\.[^.]+$/);
    const displayName = rename ? `${rename}${extMatch ? extMatch[0] : ''}` : originalName;
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const uploadUrl = await initResumableUpload(
      accessToken,
      folder.driveFolderId,
      displayName,
      mimeType,
      size,
      origin
    );

    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error('Failed to start upload:', err);
    return NextResponse.json({ error: `Could not start the upload: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
