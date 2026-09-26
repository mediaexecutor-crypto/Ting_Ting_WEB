import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabaseAdmin';

export type UserContext = {
  id: string;
  role: 'ADMIN' | 'SALESPERSON';
};

// Who's viewing, and their role — ADMIN sees everything, SALESPERSON
// only sees their own orders/customers. Reads the session cookie
// (already validated by proxy.ts middleware for this request) and looks
// up the role via the service-role client (profiles has no client-side
// read policy issue either way since this never reaches the browser).
export async function getCurrentUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  return {
    id: session.user.id,
    role: (profile?.role as 'ADMIN' | 'SALESPERSON') ?? 'SALESPERSON',
  };
}

// Convenience for pages that only need "which salesperson_id to filter
// by, if any" — null/undefined means no filter (ADMIN, sees everything).
export function scopeFilter(ctx: UserContext | null): string | undefined {
  if (!ctx) return undefined;
  return ctx.role === 'ADMIN' ? undefined : ctx.id;
}
