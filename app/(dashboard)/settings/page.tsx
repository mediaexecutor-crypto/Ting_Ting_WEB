import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/lib/team';
import TeamMembersEditor from '@/components/TeamMembersEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();

  // getSession() is a local cookie read (no network call) — the strong
  // getUser() check already happened in proxy.ts for this request.
  const [{ data: { session } }, members] = await Promise.all([
    supabase.auth.getSession(),
    getTeamMembers(),
  ]);

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Settings</div>
          <div className="muted">Team members and roles</div>
        </div>
      </div>

      <section className="panel">
        <h3>Team Members</h3>
        <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
          New teammates appear here automatically once you add them in the Supabase
          Authentication dashboard. ADMIN can see and manage every order; SALESPERSON is for
          more limited future use.
        </p>
        <TeamMembersEditor members={members} currentUserId={session?.user?.id ?? ''} />
      </section>
    </>
  );
}
