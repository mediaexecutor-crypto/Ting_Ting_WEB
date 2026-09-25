import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/lib/team';
import { getAllGoogleAccounts } from '@/lib/googleAccount';
import { getDriveTargets } from '@/lib/driveTargets';
import TeamMembersEditor from '@/components/TeamMembersEditor';
import DriveTargetsManager from '@/components/DriveTargetsManager';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const { drive_connected, drive_error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const members = await getTeamMembers();
  const accounts = await getAllGoogleAccounts();
  const targets = await getDriveTargets();

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Settings</div>
          <div className="muted">Team members, roles, and integrations</div>
        </div>
      </div>

      {drive_connected && (
        <div
          style={{
            background: '#ecfdf3',
            color: '#067647',
            border: '1px solid #abefc6',
            borderRadius: 9,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Google Drive connected successfully.
        </div>
      )}
      {drive_error && (
        <div
          style={{
            background: '#fef3f2',
            color: '#b42318',
            border: '1px solid #fecdca',
            borderRadius: 9,
            padding: 12,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {drive_error === 'no_refresh_token'
            ? 'Google already had a prior connection and didn\'t return a fresh token. Remove access at myaccount.google.com/permissions and try Connect again.'
            : `Something went wrong connecting Google Drive: ${drive_error}`}
        </div>
      )}

      <section className="panel">
        <h3>Google Drive</h3>
        <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
          Every teammate can connect their own Google account. New order folders are always
          created in whichever destination below is marked <b>Active</b> — switching active
          destinations never removes or hides folders/files already created under an older one.
        </p>

        <DriveTargetsManager targets={targets} accounts={accounts} />

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #edf0f3' }}>
          <a className="btn" href="/api/auth/google">
            Connect a Google Account
          </a>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h3>Team Members</h3>
        <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
          New teammates appear here automatically once you add them in the Supabase
          Authentication dashboard. ADMIN can see and manage every order; SALESPERSON is for
          more limited future use.
        </p>
        <TeamMembersEditor members={members} currentUserId={user?.id ?? ''} />
      </section>
    </>
  );
}
