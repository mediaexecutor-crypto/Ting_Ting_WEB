import { supabaseAdmin } from './supabaseAdmin';

export type OrderFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  note: string;
  createdAt: string;
};

export async function getOrderFiles(orderId: string): Promise<OrderFile[]> {
  const { data, error } = await supabaseAdmin
    .from('order_files')
    .select('id, file_name, file_url, note, created_at')
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
  note: string;
}) {
  const { error } = await supabaseAdmin.from('order_files').insert({
    order_id: params.orderId,
    google_account_id: params.googleAccountId,
    drive_folder_id: params.driveFolderId,
    drive_file_id: params.driveFileId,
    file_name: params.fileName,
    file_url: params.fileUrl,
    note: params.note,
  });

  if (error) {
    console.error('Failed to save order file record:', error);
    throw error;
  }
}
