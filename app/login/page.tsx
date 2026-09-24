'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7f9',
      }}
    >
      <form onSubmit={handleSubmit} className="panel" style={{ width: 340 }}>
        <div className="title" style={{ fontSize: 22, marginBottom: 4 }}>
          CODS OMS
        </div>
        <div className="muted" style={{ marginBottom: 20 }}>
          Sign in to continue
        </div>

        {error && (
          <div
            style={{
              background: '#fef3f2',
              color: '#b42318',
              border: '1px solid #fecdca',
              borderRadius: 9,
              padding: 10,
              marginBottom: 14,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div className="field" style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field" style={{ marginBottom: 18 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
