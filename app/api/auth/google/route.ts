import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getGoogleAuthUrl } from '@/lib/googleDrive';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const missing = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'].filter(
    (key) => !process.env[key] || process.env[key]!.trim() === ''
  );

  if (missing.length > 0) {
    return new NextResponse(
      `Google OAuth isn't configured yet. Missing Vercel env var(s): ${missing.join(', ')}. ` +
        `Add them in Vercel -> Settings -> Environment Variables (Production checked), redeploy, then try again.`,
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // state carries the signed-in user's id through the OAuth round trip
  // so the callback knows who to attach the connected account to.
  const url = getGoogleAuthUrl(user!.id);
  return NextResponse.redirect(url);
}
