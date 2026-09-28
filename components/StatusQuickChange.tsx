'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus, ORDER_STATUSES } from '@/lib/types';
import { statusClassName } from '@/lib/statusColors';

export default function StatusQuickChange({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: OrderStatus) {
    const prev = current;
    setCurrent(next);
    setSaving(true);

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });

    setSaving(false);

    if (!res.ok) {
      setCurrent(prev); // revert on failure
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Failed to update status.');
      return;
    }

    router.refresh();
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      onClick={(e) => e.stopPropagation()}
      className={statusClassName(current)}
      style={{ border: 'none', cursor: 'pointer', appearance: 'none', paddingRight: 18 }}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
