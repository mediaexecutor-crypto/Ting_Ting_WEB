import { supabaseAdmin } from './supabaseAdmin';

export type TeamMember = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
};

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list users:', authError);
    throw authError;
  }

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role, created_at');
  if (profileError) {
    console.error('Failed to fetch profiles:', profileError);
    throw profileError;
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return authData.users
    .map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? '',
        fullName: profile?.full_name ?? '',
        role: profile?.role ?? 'SALESPERSON',
        createdAt: (profile?.created_at as string) ?? u.created_at,
      };
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateProfile(
  id: string,
  patch: { fullName?: string; role?: string }
) {
  const update: Record<string, unknown> = {};
  if (patch.fullName !== undefined) update.full_name = patch.fullName;
  if (patch.role !== undefined) update.role = patch.role;

  const { error } = await supabaseAdmin.from('profiles').update(update).eq('id', id);
  if (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}
