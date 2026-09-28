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

  return (
    <button className="btn secondary" onClick={handleCreate} disabled={busy}>
      {busy ? 'Creating...' : 'Create Odoo Contact'}
    </button>
  );
}
