import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';
import SidebarNav from '@/components/SidebarNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // getSession() reads the session from the cookie locally (no network
  // call). Full token verification already happened in proxy.ts
  // (middleware) for this same request, so re-verifying here with
  // getUser() would just be a second, redundant round trip to Supabase's
  // auth server on every single navigation.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Belt-and-suspenders: middleware already redirects unauthenticated
  // requests, this covers the render itself.
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">CODS OMS</div>
        <SidebarNav />
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            className="muted"
            style={{ fontSize: 12, padding: '0 12px 8px', wordBreak: 'break-all', color: '#9aa4b2' }}
          >
            {session.user.email}
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
