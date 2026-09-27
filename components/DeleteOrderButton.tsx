'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteOrderButton({ orderId, invoice }: { orderId: string; invoice: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Permanently delete order "${invoice || orderId.slice(0, 8)}"? This also removes its files/notes and cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/orders');
      router.refresh();
    } else {
      setDeleting(false);
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Failed to delete order.');
    }
  }

  return (
    <button className="btn secondary" onClick={handleDelete} disabled={deleting} style={{ color: '#b42318' }}>
      {deleting ? 'Deleting...' : 'Delete Order'}
    </button>
  );
}
