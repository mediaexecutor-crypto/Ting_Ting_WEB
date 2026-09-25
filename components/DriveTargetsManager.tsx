'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DriveTarget } from '@/lib/driveTargets';
import { GoogleAccount } from '@/lib/googleAccount';

export default function DriveTargetsManager({
  targets,
  accounts,
}: {
  targets: DriveTarget[];
  accounts: GoogleAccount[];
}) {
  const router = useRouter();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id ?? '');
  const [newLabel, setNewLabel] = useState('');
  const [newFolderUrl, setNewFolderUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleActivate(id: string) {
    setActivatingId(id);
    await fetch(`/api/drive-targets/${id}/activate`, { method: 'POST' });
    setActivatingId(null);
    router.refresh();
  }

  async function handleAddTarget() {
    setError('');
    setSaving(true);

    const res = await fetch('/api/drive-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleAccountId: newAccountId,
        label: newLabel,
        folderUrl: newFolderUrl,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to add.');
      return;
    }

    setNewLabel('');
    setNewFolderUrl('');
    setShowAddForm(false);
    router.refresh();
  }

  return (
    <div>
      {targets.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid #edf0f3',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>
              {t.label}{' '}
              {t.isActive && (
                <span className="status" style={{ marginLeft: 6 }}>
                  Active
                </span>
              )}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {t.accountEmail} {t.parentFolderUrl ? '· custom folder' : '· Drive root'}
            </div>
          </div>
          {!t.isActive && (
            <button
              className="btn secondary"
              onClick={() => handleActivate(t.id)}
              disabled={activatingId === t.id}
            >
              {activatingId === t.id ? 'Switching...' : 'Set Active'}
            </button>
          )}
        </div>
      ))}
      {targets.length === 0 && (
        <div className="muted" style={{ fontSize: 13, padding: '8px 0' }}>
          No Drive destinations yet.
        </div>
      )}

      {showAddForm ? (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #edf0f3' }}>
          {error && (
            <div
              style={{
                background: '#fef3f2',
                color: '#b42318',
                border: '1px solid #fecdca',
                borderRadius: 9,
                padding: 10,
                marginBottom: 10,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Google Account</label>
            <select value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Label</label>
            <input
              placeholder="e.g. 2026 Orders"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Drive Folder Link (optional — leave blank for Drive root)</label>
            <input
              placeholder="https://drive.google.com/drive/folders/..."
              value={newFolderUrl}
              onChange={(e) => setNewFolderUrl(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button className="btn" onClick={handleAddTarget} disabled={saving}>
              {saving ? 'Saving...' : 'Add & Make Active'}
            </button>
          </div>
        </div>
      ) : (
        accounts.length > 0 && (
          <button
            className="btn secondary"
            style={{ marginTop: 14 }}
            onClick={() => setShowAddForm(true)}
          >
            + Add Another Drive Folder
          </button>
        )
      )}
    </div>
  );
}
