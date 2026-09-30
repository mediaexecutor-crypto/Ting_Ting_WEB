'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewOrderItem } from '@/lib/types';
import FileDropzone, { PendingFile } from '@/components/FileDropzone';
import { uploadFileToOrder } from '@/lib/clientUpload';

const PRODUCT_NAMES = ['RNSS', 'RNLS', 'VNSS', 'VNLS', 'Polo-SS', 'PoloLS', 'Shorts'];

const DEFAULT_PRODUCT_NOTES =
  'Price: ------------->\nCUFF RIV: -------->\nPlacket: ----------->\nFabric: ------------->\nOthers Note: ---->';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function autoGrow(e: React.FormEvent<HTMLTextAreaElement>) {
  const el = e.currentTarget;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export default function NewOrder() {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativeNumber, setAlternativeNumber] = useState('');
  const [address, setAddress] = useState('');
  const [invoice, setInvoice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [confirmedDate, setConfirmedDate] = useState(todayStr());
  const [orderType, setOrderType] = useState('Ad Customer');
  const [source, setSource] = useState('WhatsApp');
  const [priority, setPriority] = useState('Normal');
  const [items, setItems] = useState<NewOrderItem[]>([{ product: '', qty: 0, price: 0 }]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [productNotes, setProductNotes] = useState(DEFAULT_PRODUCT_NOTES);
  const [files, setFiles] = useState<PendingFile[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
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
    setProgress('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          alternativeNumber,
          address,
          invoice,
          deliveryDate,
          confirmedDate,
          orderType,
          source,
          priority,
          items,
          deliveryCharge,
          advance,
          productNotes,
          notes: '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create order.');
        setSubmitting(false);
        return;
      }

      const orderId: string = data.id;

      // The order (and its Drive folder) now exist — upload any selected
      // files straight into that folder, one at a time.
      const failed: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setProgress(`Uploading files ${i + 1}/${files.length}...`);
        const result = await uploadFileToOrder(orderId, f.file, f.name, (pct) =>
          setProgress(`Uploading files ${i + 1}/${files.length} (${pct}%)...`)
        );
        if (!result.ok) failed.push(`${f.file.name} — ${result.error}`);
      }

      if (failed.length > 0) {
        alert(
          `Order created, but these files didn't upload:\n${failed.join('\n')}\n\nYou can retry from the order's page.`
        );
        router.push(`/orders/${orderId}`);
      } else {
        router.push('/orders');
      }
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
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={handlePhoneBlur}
            />
          </div>
          <div className="field full">
            <label>Address</label>
            <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="field">
            <label>Alternative Number</label>
            <input
              value={alternativeNumber}
              onChange={(e) => setAlternativeNumber(e.target.value)}
            />
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
            <label>Order Confirmed Date</label>
            <input
              type="date"
              value={confirmedDate}
              onChange={(e) => setConfirmedDate(e.target.value)}
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
          <div className="field">
            <label>Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="">— Not set —</option>
              <option>Organic Customer</option>
              <option>Ad Customer</option>
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: 25 }}>
          Products{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
            Total Qty: {items.reduce((s, it) => s + (it.qty || 0), 0)}
          </span>
        </h3>
        <datalist id="product-names">
          {PRODUCT_NAMES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
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
              list="product-names"
              value={item.product}
              onChange={(e) => updateItem(i, { product: e.target.value })}
            />
            <input
              type="number"
              placeholder="Qty"
              value={item.qty === 0 ? '' : item.qty}
              onChange={(e) => updateItem(i, { qty: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Unit Price"
              value={item.price === 0 ? '' : item.price}
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
          onClick={() => setItems([...items, { product: '', qty: 0, price: 0 }])}
        >
          + Add Product
        </button>

        <div className="muted" style={{ marginTop: 12, fontSize: 14, textAlign: 'right' }}>
          Products Total: <b style={{ color: '#111827' }}>৳{itemsTotal.toLocaleString()}</b>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Product Details Note</label>
          <textarea
            rows={5}
            value={productNotes}
            onChange={(e) => setProductNotes(e.target.value)}
            onInput={autoGrow}
            style={{ overflow: 'hidden', resize: 'none' }}
          />
        </div>

        <h3 style={{ marginTop: 25 }}>Payment</h3>
        <div className="formgrid">
          <div className="field">
            <label>Delivery Charge</label>
            <input
              type="number"
              value={deliveryCharge === 0 ? '' : deliveryCharge}
              onChange={(e) => setDeliveryCharge(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label>Advance</label>
            <input
              type="number"
              value={advance === 0 ? '' : advance}
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
        </div>

        <div className="muted" style={{ marginTop: 4, marginBottom: 4, fontSize: 14, textAlign: 'right' }}>
          Grand Total (Products + Delivery):{' '}
          <b style={{ color: '#111827' }}>৳{grandTotal.toLocaleString()}</b>
        </div>

        <h3 style={{ marginTop: 25 }}>Files</h3>
        <p className="muted" style={{ fontSize: 12, marginTop: -8, marginBottom: 10 }}>
          Optional. Files are uploaded into the order's Drive folder as soon as the order is
          created.
        </p>
        <FileDropzone items={files} onChange={setFiles} disabled={submitting} />

        <div className="actions">
          <button className="btn secondary" onClick={() => router.push('/orders')} disabled={submitting}>
            Cancel
          </button>
          <button className="btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? progress || 'Creating...' : 'Create Order'}
          </button>
        </div>
      </section>
    </>
  );
}
