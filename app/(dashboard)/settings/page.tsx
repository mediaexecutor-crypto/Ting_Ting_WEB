import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/lib/team';
import { getConnectedGoogleAccount } from '@/lib/googleAccount';
import TeamMembersEditor from '@/components/TeamMembersEditor';

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
  const googleAccount = await getConnectedGoogleAccount();

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
        {googleAccount ? (
          <div>
            <div style={{ marginBottom: 10 }}>
              Connected as <b>{googleAccount.email}</b>. New orders automatically get a Drive
              folder, and files can be uploaded from each order's page.
            </div>
            <a className="btn secondary" href="/api/auth/google">
              Reconnect
            </a>
          </div>
        ) : (
          <div>
            <div className="muted" style={{ marginBottom: 10 }}>
              Not connected yet. Connect a Google account to enable per-order file storage.
            </div>
            <a className="btn" href="/api/auth/google">
              Connect Google Drive
            </a>
          </div>
        )}
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
