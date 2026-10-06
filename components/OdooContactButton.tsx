'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OdooContactButton({
  orderId,
  initialUrl,
}: {
  orderId: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/odoo-contact`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Failed to create Odoo contact.');
        return;
      }
      setUrl(data.url);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <a
        className="btn secondary"
        href={url}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#1d4ed8' }}
      >
        🔗 Open Contact
      </a>
    );
  }

  const [pasting, setPasting] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  async function handleSaveLink() {
    if (!linkInput.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/odoo-contact/save-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Failed to save link.');
        return;
      }
      setUrl(linkInput.trim());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (pasting) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          placeholder="Paste existing Odoo contact link"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          style={{ border: '1px solid #d8dde5', borderRadius: 7, padding: 7, width: 220 }}
        />
        <button className="btn" onClick={handleSaveLink} disabled={busy}>
          Save
        </button>
        <button className="btn secondary" onClick={() => setPasting(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="btn secondary" onClick={handleCreate} disabled={busy}>
        {busy ? 'Creating...' : 'Create Odoo Contact'}
      </button>
      <button className="btn secondary" onClick={() => setPasting(true)} disabled={busy}>
        Have a link?
      </button>
    </div>
  );
}
