import { getAllGoogleAccounts } from '@/lib/googleAccount';
import { getDriveTargets } from '@/lib/driveTargets';
import DriveTargetsManager from '@/components/DriveTargetsManager';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string }>;
};

export default async function DrivePage({ searchParams }: Props) {
  const { drive_connected, drive_error } = await searchParams;

  const [accounts, targets] = await Promise.all([getAllGoogleAccounts(), getDriveTargets()]);

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Drive Storage</div>
          <div className="muted">Connected Google accounts and folder destinations</div>
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
          destinations, or removing one, never removes or hides folders/files already created
          under it.
        </p>

        <DriveTargetsManager targets={targets} accounts={accounts} />

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #edf0f3' }}>
          <a className="btn" href="/api/auth/google">
            Connect a Google Account
          </a>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          Each order automatically gets its own Drive folder. Open any order from the Orders
          page to view or upload its files.
        </p>
      </section>
    </>
  );
}
