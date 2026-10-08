import { NextResponse } from 'next/server';
import { getOrderFolder } from '@/lib/orderFolders';
import { getValidAccessToken } from '@/lib/googleAccount';
import { getDriveFileMeta, makeFilePublic } from '@/lib/googleDrive';
import { addOrderFile } from '@/lib/orderFiles';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getCurrentUserContext } from '@/lib/auth';

// Step 3: the browser finished uploading straight to Drive. Verify the
// file really is in this order's folder (rather than trusting the
// browser) and record it, using the details Drive itself reports.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params;
  const { driveFileId } = await request.json();

  const ctx = await getCurrentUserContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  if (!driveFileId) {
    return NextResponse.json({ error: 'Missing file id.' }, { status: 400 });
  }

  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }
  if (order.salesperson_id && order.salesperson_id !== ctx.id) {
    return NextResponse.json({ error: 'Not authorized for this order.' }, { status: 403 });
  }

  try {
    const folder = await getOrderFolder(orderId);
    if (!folder) {
      return NextResponse.json({ error: 'Order folder not found.' }, { status: 400 });
    }

    const accessToken = await getValidAccessToken(folder.googleAccountId);
    const meta = await getDriveFileMeta(accessToken, driveFileId);

    if (!meta.parents?.includes(folder.driveFolderId)) {
      return NextResponse.json({ error: 'File is not in this order\'s folder.' }, { status: 400 });
    }

    // Best-effort — never fails the upload itself.
    try {
      await makeFilePublic(accessToken, meta.id);
    } catch (err) {
      console.error('Failed to make file public:', err);
    }

    await addOrderFile({
      orderId,
      googleAccountId: folder.googleAccountId,
      driveFolderId: folder.driveFolderId,
      driveFileId: meta.id,
      fileName: meta.name,
      fileUrl: meta.webViewLink,
      thumbnailUrl: meta.thumbnailLink,
      note: '',
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('Failed to record uploaded file:', err);
    return NextResponse.json({ error: 'Uploaded, but saving the record failed.' }, { status: 500 });
  }
}
