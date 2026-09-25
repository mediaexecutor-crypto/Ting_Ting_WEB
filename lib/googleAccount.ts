import { supabaseAdmin } from './supabaseAdmin';
import { encrypt, decrypt } from './crypto';
import { refreshAccessToken } from './googleDrive';
import { addDriveTarget } from './driveTargets';

export type GoogleAccount = {
  id: string;
  email: string | null;
};

export async function saveGoogleAccount(
  userId: string,
  email: string,
  accessToken: string,
  refreshToken: string
) {
  // Each distinct Google account (by email) gets its own row — team
  // members can each connect their own Drive, and the same person can
  // connect more than one account. Reconnecting the same email just
  // refreshes its stored tokens rather than creating a duplicate.
  const { data: existing, error: findError } = await supabaseAdmin
    .from('google_accounts')
    .select('id')
    .eq('provider_account_id', email)
    .maybeSingle();

  if (findError) {
    console.error('Failed to look up Google account:', findError);
    throw findError;
  }

  const record = {
    user_id: userId,
    email,
    provider_account_id: email,
    access_token_encrypted: encrypt(accessToken),
    refresh_token_encrypted: encrypt(refreshToken),
  };

  let accountId = existing?.id as string | undefined;

  if (existing) {
    const { error } = await supabaseAdmin
      .from('google_accounts')
      .update(record)
      .eq('id', existing.id);
    if (error) {
      console.error('Failed to save Google account:', error);
      throw error;
    }
  } else {
    const { data: inserted, error } = await supabaseAdmin
      .from('google_accounts')
      .insert(record)
      .select('id')
      .single();
    if (error) {
      console.error('Failed to save Google account:', error);
      throw error;
    }
    accountId = inserted.id;
  }

  // Brand new account: give it a default target (Drive root) and make
  // it active. Reconnecting an existing account (token refresh) leaves
  // its target(s) and the currently-active target untouched.
  if (!existing && accountId) {
    const { count } = await supabaseAdmin
      .from('drive_targets')
      .select('id', { count: 'exact', head: true })
      .eq('google_account_id', accountId);

    if (!count) {
      await addDriveTarget(accountId, email, '');
    }
  }
}

export async function getConnectedGoogleAccount(): Promise<GoogleAccount | null> {
  const { data, error } = await supabaseAdmin
    .from('google_accounts')
    .select('id, email')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to look up Google account:', error);
    throw error;
  }

  return data;
}

export async function getAllGoogleAccounts(): Promise<GoogleAccount[]> {
  const { data, error } = await supabaseAdmin
    .from('google_accounts')
    .select('id, email')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to list Google accounts:', error);
    throw error;
  }

  return data ?? [];
}

// Always refreshes using the stored refresh_token — no expiry bookkeeping
// needed, simpler for a lite v1 at the cost of one extra request per use.
export async function getValidAccessToken(googleAccountId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('google_accounts')
    .select('refresh_token_encrypted')
    .eq('id', googleAccountId)
    .single();

  if (error || !data) {
    console.error('Failed to load Google account tokens:', error);
    throw error ?? new Error('Google account not found.');
  }

  const refreshToken = decrypt(data.refresh_token_encrypted as string);
  const { access_token } = await refreshAccessToken(refreshToken);
  return access_token;
}
