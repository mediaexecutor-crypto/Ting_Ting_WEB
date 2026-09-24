import { supabaseAdmin } from './supabaseAdmin';
import { getConnectedGoogleAccount, getValidAccessToken } from './googleAccount';
import { createDriveFolder } from './googleDrive';

export type OrderFolder = {
  id: string;
  driveFolderId: string;
  driveUrl: string;
  googleAccountId: string;
};

export async function getOrderFolder(orderId: string): Promise<OrderFolder | null> {
  const { data, error } = await supabaseAdmin
    .from('google_drive_folders')
    .select('id, drive_folder_id, drive_url, google_account_id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Failed to look up order folder:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    driveFolderId: data.drive_folder_id,
    driveUrl: data.drive_url,
    googleAccountId: data.google_account_id,
  };
}

// Creates the order's Drive folder if it doesn't exist yet. Returns null
// (instead of throwing) when no Google account is connected, so callers
// like order creation can skip Drive entirely without failing the order.
export async function getOrCreateOrderFolder(
  orderId: string,
  folderName: string
): Promise<OrderFolder | null> {
  const existing = await getOrderFolder(orderId);
  if (existing) return existing;

  const account = await getConnectedGoogleAccount();
  if (!account) return null;

  const accessToken = await getValidAccessToken(account.id);
  const folder = await createDriveFolder(accessToken, folderName);

  const { data, error } = await supabaseAdmin
    .from('google_drive_folders')
    .insert({
      google_account_id: account.id,
      order_id: orderId,
      name: folderName,
      drive_folder_id: folder.id,
      drive_url: folder.url,
    })
    .select('id, drive_folder_id, drive_url, google_account_id')
    .single();

  if (error) {
    console.error('Failed to save order folder:', error);
    throw error;
  }

  return {
    id: data.id,
    driveFolderId: data.drive_folder_id,
    driveUrl: data.drive_url,
    googleAccountId: data.google_account_id,
  };
}
