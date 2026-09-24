import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side client (Server Components, layouts) that reads/writes the
// Supabase auth session via Next.js cookies. Used only to know WHO is
// logged in — actual data reads/writes still go through supabaseAdmin
// (see lib/supabaseAdmin.ts) until per-user RLS access is wired up.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware already
            // refreshes the session cookie on the request, so this is safe
            // to ignore here.
          }
        },
      },
    }
  );
}
