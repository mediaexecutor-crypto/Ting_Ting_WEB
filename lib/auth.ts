import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabaseAdmin';

export type UserContext = {
  id: string;
  role: 'ADMIN' | 'SALESPERSON';
};

// Who's viewing, and their role. Reads the session cookie (already
// validated by proxy.ts middleware for this request) and looks up the
// role via the service-role client.
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
// by". Everyone — ADMIN included — only sees orders/customers they
// created themselves; there's no cross-visibility role anymore.
export function scopeFilter(ctx: UserContext | null): string | undefined {
  return ctx?.id;
}
