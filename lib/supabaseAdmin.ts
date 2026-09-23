import { createClient } from '@supabase/supabase-js';

// Server-only client. Uses the service role key so reads/writes work
// before a real login/auth flow exists (the RLS policies in
// supabase/schema.sql require auth.uid(), which anonymous requests
// don't have). NEVER import this file from a 'use client' component —
// the service role key must stay on the server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
