import { supabaseAdmin } from './supabaseAdmin';
import { encrypt, decrypt } from './crypto';
import { refreshAccessToken } from './googleDrive';

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
  // One connected Drive account is enough for this small team; if the
  // same Google account reconnects (or a different teammate connects),
  // update the existing row by provider_account_id so we don't pile up
  // duplicates. (No DB-level unique constraint on that column, so this
  // is done as an explicit check rather than an upsert/onConflict.)
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

  const { error } = existing
    ? await supabaseAdmin.from('google_accounts').update(record).eq('id', existing.id)
    : await supabaseAdmin.from('google_accounts').insert(record);

  if (error) {
    console.error('Failed to save Google account:', error);
    throw error;
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
