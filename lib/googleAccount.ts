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
  // upsert by provider_account_id so we don't pile up duplicate rows.
  const { error } = await supabaseAdmin.from('google_accounts').upsert(
    {
      user_id: userId,
      email,
      provider_account_id: email,
      access_token_encrypted: encrypt(accessToken),
      refresh_token_encrypted: encrypt(refreshToken),
    },
    { onConflict: 'provider_account_id' }
  );

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
