import { NextResponse } from 'next/server';
import { getOrCreateOrderFolder } from '@/lib/orderFolders';
import { getValidAccessToken } from '@/lib/googleAccount';
import { uploadFileToDrive } from '@/lib/googleDrive';
import { addOrderFile } from '@/lib/orderFiles';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const note = (formData.get('note') as string) || '';

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  // Look up the order's customer+phone to name the folder if it doesn't exist yet.
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('customers ( name, phone )')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const customer: any = order.customers;
  const folderName =
    [customer?.name?.trim(), customer?.phone?.trim()].filter(Boolean).join(' - ') ||
    `Order ${orderId}`;

  try {
    const folder = await getOrCreateOrderFolder(orderId, folderName);

    if (!folder) {
      return NextResponse.json(
        { error: 'No Google Drive account connected yet. Connect it in Settings first.' },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(folder.googleAccountId);
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Use the note as the display filename when given (the "rename" the
    // user asked for), keep the original extension.
    const extMatch = file.name.match(/\.[^.]+$/);
    const displayName = note.trim()
      ? `${note.trim()}${extMatch ? extMatch[0] : ''}`
      : file.name;

    const uploaded = await uploadFileToDrive(
      accessToken,
      folder.driveFolderId,
      displayName,
      file.type || 'application/octet-stream',
      bytes
    );

    await addOrderFile({
      orderId,
      googleAccountId: folder.googleAccountId,
      driveFolderId: folder.driveFolderId,
      driveFileId: uploaded.id,
      fileName: displayName,
      fileUrl: uploaded.webViewLink,
      note,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('File upload failed:', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
