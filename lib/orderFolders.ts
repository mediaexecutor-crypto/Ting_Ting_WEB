import { supabaseAdmin } from './supabaseAdmin';
import { getActiveDriveTarget } from './driveTargets';
import { getValidAccessToken } from './googleAccount';
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

// Creates the order's Drive folder if it doesn't exist yet, inside
// whichever Drive target is currently marked active. Returns null
// (instead of throwing) when nothing is connected yet, so callers like
// order creation can skip Drive entirely without failing the order.
export async function getOrCreateOrderFolder(
  orderId: string,
  folderName: string
): Promise<OrderFolder | null> {
  const existing = await getOrderFolder(orderId);
  if (existing) return existing;

  const target = await getActiveDriveTarget();
  if (!target) return null;

  const accessToken = await getValidAccessToken(target.googleAccountId);
  const folder = await createDriveFolder(
    accessToken,
    folderName,
    target.parentFolderId ?? undefined
  );

  const { data, error } = await supabaseAdmin
    .from('google_drive_folders')
    .insert({
      google_account_id: target.googleAccountId,
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
