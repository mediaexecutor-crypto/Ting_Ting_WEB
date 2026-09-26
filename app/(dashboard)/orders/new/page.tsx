'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewOrderItem } from '@/lib/types';

export default function NewOrder() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [invoice, setInvoice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [source, setSource] = useState('Facebook');
  const [priority, setPriority] = useState('Normal');
  const [items, setItems] = useState<NewOrderItem[]>([
    { product: '', qty: 1, price: 0 },
  ]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill from a Customers-page "+ New Order" link (?name=&phone=&address=).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qName = params.get('name');
    const qPhone = params.get('phone');
    const qAddress = params.get('address');
    if (qName) setCustomerName(qName);
    if (qPhone) setPhone(qPhone);
    if (qAddress) setAddress(qAddress);
  }, []);

  // Typing a phone number that already belongs to a saved customer
  // auto-fills their name and address.
  async function handlePhoneBlur() {
    if (!phone.trim()) return;
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (data.customer) {
        setCustomerName(data.customer.name ?? '');
        setAddress(data.customer.address ?? '');
      }
    } catch {
      // Non-critical — the person can just type it in manually.
    }
  }

  const itemsTotal = items.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);
  const grandTotal = itemsTotal + (deliveryCharge || 0);
  const due = grandTotal - (advance || 0);

  function updateItem(index: number, patch: Partial<NewOrderItem>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          invoice,
          deliveryDate,
          source,
          priority,
          items,
          deliveryCharge,
          advance,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create order.');
        setSubmitting(false);
        return;
      }

      router.push('/orders');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Create Order</div>
          <div className="muted">
            Nothing here is required — fill in what you have now, edit the rest later from the
            order's page.
          </div>
        </div>
      </div>

      <section className="panel">
        {error && (
          <div
            style={{
              background: '#fef3f2',
              color: '#b42318',
              border: '1px solid #fecdca',
              borderRadius: 9,
              padding: 12,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <h3>Customer</h3>
        <div className="formgrid">
          <div className="field">
            <label>Customer Name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={handlePhoneBlur} />
          </div>
          <div className="field full">
            <label>Address</label>
            <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <h3 style={{ marginTop: 25 }}>Order Information</h3>
        <div className="formgrid">
          <div className="field">
            <label>Invoice Number (max 6 characters, optional)</label>
            <input
              placeholder="Optional"
              maxLength={6}
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Expected Delivery</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Order Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option>Facebook</option>
              <option>WhatsApp</option>
              <option>Call</option>
              <option>Walk-in</option>
              <option>Reference</option>
              <option>Other</option>
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>Normal</option>
              <option>Urgent</option>
              <option>Emergency</option>
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: 25 }}>Products</h3>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 130px 110px 40px',
              gap: 8,
              marginBottom: 8,
              alignItems: 'center',
            }}
          >
            <input
              placeholder="Product"
              value={item.product}
              onChange={(e) => updateItem(i, { product: e.target.value })}
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Unit Price"
              value={item.price}
              onChange={(e) => updateItem(i, { price: Number(e.target.value) })}
            />
            <div className="muted" style={{ fontSize: 13, textAlign: 'right' }}>
              ৳{((item.qty || 0) * (item.price || 0)).toLocaleString()}
            </div>
            <button
              className="btn secondary"
              onClick={() => setItems(items.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="btn secondary"
          onClick={() => setItems([...items, { product: '', qty: 1, price: 0 }])}
        >
          + Add Product
        </button>

        <div
          className="muted"
          style={{ marginTop: 12, fontSize: 14, textAlign: 'right' }}
        >
          Products Total: <b style={{ color: '#111827' }}>৳{itemsTotal.toLocaleString()}</b>
        </div>

        <h3 style={{ marginTop: 25 }}>Payment</h3>
        <div className="formgrid">
          <div className="field">
            <label>Delivery Charge</label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Advance</label>
            <input
              type="number"
              value={advance}
              onChange={(e) => setAdvance(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Due (auto)</label>
            <input
              type="text"
              value={`৳${due.toLocaleString()}`}
              readOnly
              style={{ background: '#f4f6f8', fontWeight: 700 }}
            />
          </div>
          <div className="field full">
            <label>Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div
          className="muted"
          style={{ marginTop: 4, marginBottom: 4, fontSize: 14, textAlign: 'right' }}
        >
          Grand Total (Products + Delivery):{' '}
          <b style={{ color: '#111827' }}>৳{grandTotal.toLocaleString()}</b>
        </div>

        <div className="actions">
          <button className="btn secondary" onClick={() => router.push('/orders')}>
            Cancel
          </button>
          <button className="btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </section>
    </>
  );
}
