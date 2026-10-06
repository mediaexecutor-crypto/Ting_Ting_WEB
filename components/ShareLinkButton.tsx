'use client';
import { useState } from 'react';

export default function ShareLinkButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/share`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? 'Failed to create share link.');
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn secondary" onClick={handleClick} disabled={busy}>
      {busy ? 'Creating...' : copied ? 'Link Copied ✓' : 'Share Link'}
    </button>
  );
}
