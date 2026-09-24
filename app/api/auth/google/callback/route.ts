import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserEmail } from '@/lib/googleDrive';
import { saveGoogleAccount } from '@/lib/googleAccount';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code || !userId) {
    return NextResponse.redirect(`${origin}/settings?drive_error=1`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      // Happens if the user has already granted consent before and Google
      // skips issuing a fresh refresh_token. They need to revoke access at
      // https://myaccount.google.com/permissions and reconnect.
      return NextResponse.redirect(`${origin}/settings?drive_error=no_refresh_token`);
    }

    const email = await getGoogleUserEmail(tokens.access_token);
    await saveGoogleAccount(userId, email, tokens.access_token, tokens.refresh_token);

    return NextResponse.redirect(`${origin}/settings?drive_connected=1`);
  } catch (err) {
    console.error('Google OAuth callback failed:', err);
    return NextResponse.redirect(`${origin}/settings?drive_error=1`);
  }
}
