'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COURIERS = ['Steadfast', 'Sundarban / SA Paribahan', 'Customer Receive', 'Instant Pathao', 'We Deliver'];

export default function CourierQuickChange({
  orderId,
  courier,
  compact,
}: {
  orderId: string;
  courier: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(courier);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    const prev = value;
    setValue(next);
    setSaving(true);
    const res = await fetch(`/api/orders/${orderId}/courier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courier: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setValue(prev);
      alert('Failed to update courier.');
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        border: '1px solid #d8dde5',
        borderRadius: 7,
        padding: 6,
        maxWidth: compact ? 130 : undefined,
        fontSize: compact ? 12 : undefined,
      }}
    >
      <option value="">— Select —</option>
      {COURIERS.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
