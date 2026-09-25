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

export async function getDriveTargets(): Promise<DriveTarget[]> {
  const { data, error } = await supabaseAdmin
    .from('drive_targets')
    .select('id, google_account_id, label, parent_folder_id, parent_folder_url, is_active, created_at, google_accounts ( email )')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch Drive targets:', error);
    throw error;
  }

  return (data ?? []).map((t: any) => ({
    id: t.id,
    googleAccountId: t.google_account_id,
    accountEmail: t.google_accounts?.email ?? '',
    label: t.label,
    parentFolderId: t.parent_folder_id,
    parentFolderUrl: t.parent_folder_url,
    isActive: t.is_active,
    createdAt: t.created_at,
  }));
}

export async function getActiveDriveTarget(): Promise<DriveTarget | null> {
  const { data, error } = await supabaseAdmin
    .from('drive_targets')
    .select('id, google_account_id, label, parent_folder_id, parent_folder_url, is_active, created_at, google_accounts ( email )')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch active Drive target:', error);
    throw error;
  }
  if (!data) return null;

  const t: any = data;
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

// Adds a new target and makes it the active one. Existing targets are
// kept (never deleted) so old order folders stay correctly linked.
export async function addDriveTarget(
  googleAccountId: string,
  label: string,
  parentFolderUrlOrId: string
) {
  const parentFolderId = parentFolderUrlOrId ? extractFolderId(parentFolderUrlOrId) : null;

  await supabaseAdmin.from('drive_targets').update({ is_active: false }).eq('is_active', true);

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

export async function setActiveDriveTarget(id: string) {
  await supabaseAdmin.from('drive_targets').update({ is_active: false }).eq('is_active', true);

  const { error } = await supabaseAdmin
    .from('drive_targets')
    .update({ is_active: true })
    .eq('id', id);

  if (error) {
    console.error('Failed to set active Drive target:', error);
    throw error;
  }
}

// Removes a target from the list (does not touch already-created order
// folders/files — those keep referencing their google_account_id
// directly, so nothing existing breaks). If the removed target was
// active, the next-oldest remaining target (if any) becomes active.
export async function deleteDriveTarget(id: string) {
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
    const { data: next } = await supabaseAdmin
      .from('drive_targets')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabaseAdmin.from('drive_targets').update({ is_active: true }).eq('id', next.id);
    }
  }
}
