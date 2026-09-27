'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok) {
      alert(data.error ?? 'Failed to delete customer.');
      return;
    }
    router.refresh();
  }

  return (
    <button className="btn secondary" onClick={handleDelete} disabled={deleting} style={{ color: '#b42318' }}>
      {deleting ? '...' : 'Delete'}
    </button>
  );
}
