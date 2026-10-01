'use client';
import { useState } from 'react';

type Props = {
  invoice: string;
  name: string;
  phone: string;
  address: string;
  cod: number;
  deliveryChargeSet: boolean;
};

export default function CopyDeliveryButton({
  invoice,
  name,
  phone,
  address,
  cod,
  deliveryChargeSet,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address || '—'}`,
      `COD: ৳${cod.toLocaleString()}`,
      `Invoice: ${invoice}`,
      `DC: ${deliveryChargeSet ? 'Included' : 'Not Included'}`,
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
