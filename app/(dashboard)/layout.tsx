import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: middleware already redirects unauthenticated
  // requests, this covers the render itself.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">CODS OMS</div>
        <nav className="nav">
          <Link className="active" href="/">
            🏠 Dashboard
          </Link>
          <Link href="/orders">📦 Orders</Link>
          <Link href="/customers">👤 Customers</Link>
          <Link href="/deliveries">🚚 Deliveries</Link>
          <Link href="/calendar">📅 Calendar</Link>
          <Link href="/drive">📁 Drive Storage</Link>
          <Link href="/reports">📊 Reports</Link>
          <Link href="/settings">⚙️ Settings</Link>
        </nav>
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            className="muted"
            style={{ fontSize: 12, padding: '0 12px 8px', wordBreak: 'break-all', color: '#9aa4b2' }}
          >
            {user.email}
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
