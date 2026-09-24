import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getGoogleAuthUrl } from '@/lib/googleDrive';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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
