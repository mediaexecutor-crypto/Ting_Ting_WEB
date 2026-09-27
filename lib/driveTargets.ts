import { supabaseAdmin } from './supabaseAdmin';

export type DriveTarget = {
  id: string;
  googleAccountId: string;
  accountEmail: string;
  label: string;
  parentFolderId: string | null;
  parentFolderUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export function extractFolderId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Looks like a bare folder ID was pasted instead of a full URL.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

function mapRow(t: any): DriveTarget {
  return {
    id: t.id,
    googleAccountId: t.google_account_id,
    accountEmail: t.google_accounts?.email ?? '',
    label: t.label,
    parentFolderId: t.parent_folder_id,
    parentFolderUrl: t.parent_folder_url,
    isActive: t.is_active,
    createdAt: t.created_at,
  };
}

// Every Drive connection/target is personal — each teammate only sees
// and manages the ones tied to Google accounts THEY connected. One
// person's active target never affects anyone else's.
export async function getDriveTargets(userId: string): Promise<DriveTarget[]> {
  const { data, error } = await supabaseAdmin
    .from('drive_targets')
    .select(
      'id, google_account_id, label, parent_folder_id, parent_folder_url, is_active, created_at, google_accounts!inner ( email, user_id )'
    )
    .eq('google_accounts.user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch Drive targets:', error);
    throw error;
  }

  return (data ?? []).map(mapRow);
}

export async function getActiveDriveTarget(userId: string): Promise<DriveTarget | null> {
  const { data, error } = await supabaseAdmin
    .from('drive_targets')
    .select(
      'id, google_account_id, label, parent_folder_id, parent_folder_url, is_active, created_at, google_accounts!inner ( email, user_id )'
    )
    .eq('google_accounts.user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch active Drive target:', error);
    throw error;
  }
  if (!data) return null;

  return mapRow(data);
}

// Adds a new target and makes it the active one for this user. Existing
// targets (this user's or anyone else's) are kept — never deleted — so
// old order folders stay correctly linked.
export async function addDriveTarget(
  googleAccountId: string,
  label: string,
  parentFolderUrlOrId: string,
  userId: string
) {
  const parentFolderId = parentFolderUrlOrId ? extractFolderId(parentFolderUrlOrId) : null;

  await deactivateAllForUser(userId);

  const { error } = await supabaseAdmin.from('drive_targets').insert({
    google_account_id: googleAccountId,
    label: label.trim() || 'Drive folder',
    parent_folder_id: parentFolderId,
    parent_folder_url: parentFolderId ? parentFolderUrlOrId.trim() : null,
    is_active: true,
  });

  if (error) {
    console.error('Failed to add Drive target:', error);
    throw error;
  }
}

export async function setActiveDriveTarget(id: string, userId: string) {
  await deactivateAllForUser(userId);

  const { error } = await supabaseAdmin
    .from('drive_targets')
    .update({ is_active: true })
    .eq('id', id);

  if (error) {
    console.error('Failed to set active Drive target:', error);
    throw error;
  }
}

// Removes a target from this user's list (does not touch already-created
// order folders/files — those keep referencing their google_account_id
// directly, so nothing existing breaks). If the removed target was
// active, the next-oldest remaining target of THIS user (if any)
// becomes active.
export async function deleteDriveTarget(id: string, userId: string) {
  const { data: target, error: findError } = await supabaseAdmin
    .from('drive_targets')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    console.error('Failed to look up Drive target:', findError);
    throw findError;
  }

  const { error: deleteError } = await supabaseAdmin.from('drive_targets').delete().eq('id', id);
  if (deleteError) {
    console.error('Failed to delete Drive target:', deleteError);
    throw deleteError;
  }

  if (target?.is_active) {
    const remaining = await getDriveTargets(userId);
    if (remaining.length > 0) {
      await supabaseAdmin
        .from('drive_targets')
        .update({ is_active: true })
        .eq('id', remaining[0].id);
    }
  }
}

async function deactivateAllForUser(userId: string) {
  const existing = await getDriveTargets(userId);
  const activeIds = existing.filter((t) => t.isActive).map((t) => t.id);
  if (activeIds.length > 0) {
    await supabaseAdmin.from('drive_targets').update({ is_active: false }).in('id', activeIds);
  }
}
