import Link from 'next/link';
import { getConnectedGoogleAccount } from '@/lib/googleAccount';

export const dynamic = 'force-dynamic';

export default async function DrivePage() {
  const account = await getConnectedGoogleAccount();

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Drive Storage</div>
          <div className="muted">Files are organized per order</div>
        </div>
      </div>

      <section className="panel">
        {account ? (
          <div>
            <div style={{ marginBottom: 10 }}>
              Connected as <b>{account.email}</b>.
            </div>
            <p className="muted" style={{ fontSize: 14 }}>
              Each order automatically gets its own Drive folder. Open any order from the{' '}
              <Link href="/orders">Orders</Link> page to view or upload its files.
            </p>
          </div>
        ) : (
          <div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 10 }}>
              No Google Drive account connected yet.
            </p>
            <Link className="btn" href="/settings">
              Connect in Settings
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
