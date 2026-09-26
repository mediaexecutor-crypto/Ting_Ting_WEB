import { supabaseAdmin } from './supabaseAdmin';
import { getValidAccessToken } from './googleAccount';
import { deleteFileFromDrive } from './googleDrive';

export type OrderFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  note: string;
  createdAt: string;
};

export async function getOrderFiles(orderId: string): Promise<OrderFile[]> {
  const { data, error } = await supabaseAdmin
    .from('order_files')
    .select('id, file_name, file_url, thumbnail_url, note, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch order files:', error);
    throw error;
  }

  return (data ?? []).map((f) => ({
    id: f.id,
    fileName: f.file_name,
    fileUrl: f.file_url ?? '',
    thumbnailUrl: f.thumbnail_url ?? '',
    note: f.note ?? '',
    createdAt: f.created_at,
  }));
}

export async function addOrderFile(params: {
  orderId: string;
  googleAccountId: string;
  driveFolderId: string;
  driveFileId: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  note: string;
}) {
  const { error } = await supabaseAdmin.from('order_files').insert({
    order_id: params.orderId,
    google_account_id: params.googleAccountId,
    drive_folder_id: params.driveFolderId,
    drive_file_id: params.driveFileId,
    file_name: params.fileName,
    file_url: params.fileUrl,
    thumbnail_url: params.thumbnailUrl ?? null,
    note: params.note,
  });

  if (error) {
    console.error('Failed to save order file record:', error);
    throw error;
  }
}

// Deletes the file from Drive (best-effort — the row is removed either
// way, so a Drive hiccup never leaves a "stuck" file in the UI) and
// removes our record of it.
export async function deleteOrderFile(fileId: string) {
  const { data, error } = await supabaseAdmin
    .from('order_files')
    .select('drive_file_id, google_account_id')
    .eq('id', fileId)
    .maybeSingle();

  if (error) {
    console.error('Failed to look up file before delete:', error);
    throw error;
  }

  if (data?.google_account_id && data?.drive_file_id) {
    try {
      const accessToken = await getValidAccessToken(data.google_account_id);
      await deleteFileFromDrive(accessToken, data.drive_file_id);
    } catch (err) {
      console.error('Failed to delete file from Drive (removing our record anyway):', err);
    }
  }

  const { error: deleteError } = await supabaseAdmin.from('order_files').delete().eq('id', fileId);
  if (deleteError) {
    console.error('Failed to delete order file record:', deleteError);
    throw deleteError;
  }
}
