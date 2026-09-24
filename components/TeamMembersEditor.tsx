'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeamMember } from '@/lib/team';

const ROLES = ['ADMIN', 'SALESPERSON'];

export default function TeamMembersEditor({
  members,
  currentUserId,
}: {
  members: TeamMember[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(members);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function updateRow(id: string, patch: Partial<TeamMember>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function handleSave(row: TeamMember) {
    setSavingId(row.id);
    setSavedId(null);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, fullName: row.fullName, role: row.role }),
      });

      if (res.ok) {
        setSavedId(row.id);
        router.refresh();
        setTimeout(() => setSavedId(null), 1800);
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <input
                value={row.fullName}
                onChange={(e) => updateRow(row.id, { fullName: e.target.value })}
                style={{ border: '1px solid #d8dde5', borderRadius: 7, padding: 7, width: '100%' }}
              />
            </td>
            <td>
              {row.email}
              {row.id === currentUserId && (
                <span className="status" style={{ marginLeft: 8 }}>
                  You
                </span>
              )}
            </td>
            <td>
              <select
                value={row.role}
                onChange={(e) => updateRow(row.id, { role: e.target.value })}
                style={{ border: '1px solid #d8dde5', borderRadius: 7, padding: 7 }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <button
                className="btn secondary"
                onClick={() => handleSave(row)}
                disabled={savingId === row.id}
              >
                {savingId === row.id ? 'Saving...' : savedId === row.id ? 'Saved ✓' : 'Save'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
