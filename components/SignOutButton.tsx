'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="btn secondary" style={{ width: '100%' }}>
      Sign Out
    </button>
  );
}
