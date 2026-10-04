'use client';
import { useState } from 'react';

type Props = {
  invoice: string;
  name: string;
  phone: string;
  address: string;
  cod: number;
  courier: string;
};

export default function CopyDeliveryButton({
  invoice,
  name,
  phone,
  address,
  cod,
  courier,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address || '—'}`,
      `COD: ৳${cod.toLocaleString()}`,
      `Invoice: ${invoice}`,
      `DC: ${courier ? 'Included' : 'Not Included'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable (e.g. non-HTTPS) — silently ignore
    }
  }

  return (
    <button className="btn secondary" onClick={handleCopy}>
      {copied ? 'Copied ✓' : 'Copy Delivery Info'}
    </button>
  );
}
