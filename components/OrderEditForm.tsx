'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderDetail } from '@/lib/orders';
import { ORDER_STATUSES, NewOrderItem } from '@/lib/types';
import { statusClassName } from '@/lib/statusColors';
import { isOverdue } from '@/lib/date';

function itemsFromOrder(order: OrderDetail): NewOrderItem[] {
  return order.items.length > 0
    ? order.items.map((it) => ({ product: it.product, qty: it.qty, price: it.price }))
    : [{ product: '', qty: 1, price: 0 }];
}

export default function OrderEditForm({ order }: { order: OrderDetail }) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);

  const [status, setStatus] = useState(order.status);
  const [customerName, setCustomerName] = useState(order.customer);
  const [phone, setPhone] = useState(order.phone);
  const [address, setAddress] = useState(order.address);
  const [invoice, setInvoice] = useState(order.invoice);
  const [deliveryDate, setDeliveryDate] = useState(order.delivery || '');
  const [confirmedDate, setConfirmedDate] = useState(order.confirmedDate || '');
  const [source, setSource] = useState(order.source || 'Facebook');
  const [priority, setPriority] = useState('Normal');
  const [items, setItems] = useState<NewOrderItem[]>(itemsFromOrder(order));
  const [deliveryCharge, setDeliveryCharge] = useState(order.deliveryCharge);
  const [advance, setAdvance] = useState(order.advance);
  const [productNotes, setProductNotes] = useState(order.productNotes);
  const [notes, setNotes] = useState(order.notes);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const itemsTotal = items.reduce((sum, it) => sum + (it.qty || 0) * (it.price || 0), 0);
  const grandTotal = itemsTotal + (deliveryCharge || 0);
  const due = grandTotal - (advance || 0);

  function updateItem(index: number, patch: Partial<NewOrderItem>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleCancel() {
    setStatus(order.status);
    setCustomerName(order.customer);
    setPhone(order.phone);
    setAddress(order.address);
    setInvoice(order.invoice);
    setDeliveryDate(order.delivery || '');
    setConfirmedDate(order.confirmedDate || '');
    setSource(order.source || 'Facebook');
    setItems(itemsFromOrder(order));
    setDeliveryCharge(order.deliveryCharge);
    setAdvance(order.advance);
    setProductNotes(order.productNotes);
    setNotes(order.notes);
    setError('');
    setEditing(false);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          invoice,
          deliveryDate,
          confirmedDate,
          source,
          priority,
          status,
          items,
          deliveryCharge,
          advance,
          productNotes,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to save.');
        setSaving(false);
        return;
      }

      setSaving(false);
      setSaved(true);
      setEditing(false);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Network error — please try again.');
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------
  // VIEW MODE — clean read-only display, matching the original layout
  // ---------------------------------------------------------------
  if (!editing) {
    return (
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button className="btn secondary" onClick={() => setEditing(true)}>
            ✎ Edit
          </button>
        </div>

        <h3>Order Info</h3>
        <table className="table">
          <tbody>
            <tr>
              <td className="muted">Status</td>
              <td>
                <span className={statusClassName(order.status)}>{order.status}</span>
              </td>
            </tr>
            <tr>
              <td className="muted">Customer</td>
              <td>{order.customer || '—'}</td>
            </tr>
            <tr>
              <td className="muted">Phone</td>
              <td>{order.phone || '—'}</td>
            </tr>
            <tr>
              <td className="muted">Address</td>
              <td>{order.address || '—'}</td>
            </tr>
            <tr>
              <td className="muted">Order Confirmed Date</td>
              <td>{order.confirmedDate || '—'}</td>
            </tr>
            <tr>
              <td className="muted">Delivery Date</td>
              <td>
                {order.delivery || '—'}
                {order.delivery && isOverdue(order.delivery, order.status) && (
                  <span style={{ color: '#b42318', fontWeight: 700, marginLeft: 8 }}>OVERDUE</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="muted">Source</td>
              <td>{order.source || '—'}</td>
            </tr>
            <tr>
              <td className="muted">Products Total</td>
              <td>৳{order.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="muted">Delivery Charge</td>
              <td>৳{order.deliveryCharge.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="muted">Advance Paid</td>
              <td>৳{order.advance.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="muted">Due</td>
              <td>
                <b>৳{order.due.toLocaleString()}</b>
              </td>
            </tr>
            {order.productNotes && (
              <tr>
                <td className="muted">Product Details Note</td>
                <td>{order.productNotes}</td>
              </tr>
            )}
            {order.notes && (
              <tr>
                <td className="muted">Notes</td>
                <td>{order.notes}</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3 style={{ marginTop: 22 }}>
          Products{' '}
          <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
            Total Qty: {order.items.reduce((s, it) => s + it.qty, 0)}
          </span>
        </h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>{it.product}</td>
                <td>{it.qty}</td>
                <td>৳{it.price.toLocaleString()}</td>
              </tr>
            ))}
            {order.items.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  No products listed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    );
  }

  // ---------------------------------------------------------------
  // EDIT MODE
  // ---------------------------------------------------------------
  return (
    <section className="panel">
      <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Editing — remember to Save.
      </div>

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

      <div className="field" style={{ marginBottom: 18, maxWidth: 260 }}>
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className={statusClassName(status)} style={{ marginTop: 4, width: 'fit-content' }}>
          {status}
        </span>
      </div>

      <h3>Customer</h3>
      <div className="formgrid">
        <div className="field">
          <label>Customer Name</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field full">
          <label>Address</label>
          <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      <h3 style={{ marginTop: 25 }}>Order Information</h3>
      <div className="formgrid">
        <div className="field">
          <label>Invoice Number (max 6 characters)</label>
          <input maxLength={6} value={invoice} onChange={(e) => setInvoice(e.target.value)} />
        </div>
        <div className="field">
          <label>Order Confirmed Date</label>
          <input type="date" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Expected Delivery</label>
          <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
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

      <h3 style={{ marginTop: 25 }}>
        Products{' '}
        <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>
          Total Qty: {items.reduce((s, it) => s + (it.qty || 0), 0)}
        </span>
      </h3>
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
            value={item.price === 0 ? '' : item.price}
            onChange={(e) => updateItem(i, { price: Number(e.target.value) })}
          />
          <div className="muted" style={{ fontSize: 13, textAlign: 'right' }}>
            ৳{((item.qty || 0) * (item.price || 0)).toLocaleString()}
          </div>
          <button className="btn secondary" onClick={() => setItems(items.filter((_, j) => j !== i))}>
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
      <div className="muted" style={{ marginTop: 10, fontSize: 14, textAlign: 'right' }}>
        Products Total: <b style={{ color: '#111827' }}>৳{itemsTotal.toLocaleString()}</b>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Product Details Note</label>
        <textarea
          rows={2}
          placeholder="Fabric, size breakdown, design notes..."
          value={productNotes}
          onChange={(e) => setProductNotes(e.target.value)}
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
        <div className="field full">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="muted" style={{ marginBottom: 4, fontSize: 14, textAlign: 'right' }}>
        Grand Total (Products + Delivery): <b style={{ color: '#111827' }}>৳{grandTotal.toLocaleString()}</b>
      </div>

      <div className="actions">
        <button className="btn secondary" onClick={handleCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
    </section>
  );
}
