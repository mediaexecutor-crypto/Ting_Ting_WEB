import { createBrowserClient } from '@supabase/ssr';

// Browser-side client for client components (login form, sign-out button).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
