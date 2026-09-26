'use client';
import { useRef, useState } from 'react';
import { OrderDetail } from '@/lib/orders';

export default function InvoiceView({ order }: { order: OrderDetail }) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPng() {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `invoice-${order.invoice || order.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const totalQty = order.items.reduce((s, it) => s + it.qty, 0);

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh', padding: '30px 16px' }}>
      <div className="invoice-actions" style={{ maxWidth: 640, margin: '0 auto 16px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn secondary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <button className="btn" onClick={handleDownloadPng} disabled={downloading}>
          {downloading ? 'Preparing...' : 'Download PNG'}
        </button>
      </div>

      <div
        ref={invoiceRef}
        style={{
          maxWidth: 640,
          margin: '0 auto',
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          fontFamily: 'inherit',
          color: '#17202a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>CODS Clothing Co.</div>
            <div className="muted" style={{ fontSize: 13 }}>Custom Jersey &amp; Garment Orders</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>INVOICE</div>
            <div className="muted" style={{ fontSize: 13 }}>{order.invoice || 'No Invoice'}</div>
            {order.orderDate && <div className="muted" style={{ fontSize: 13 }}>{order.orderDate}</div>}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #edf0f3', borderBottom: '1px solid #edf0f3', padding: '16px 0', marginBottom: 20 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>BILL TO</div>
          <div style={{ fontWeight: 700 }}>{order.customer || '—'}</div>
          <div>{order.phone}</div>
          <div>{order.address}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #17202a' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: 13 }}>Product</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 13 }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 13 }}>Price</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 13 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid #edf0f3' }}>
                <td style={{ padding: '8px 4px' }}>{it.product}</td>
                <td style={{ textAlign: 'right', padding: '8px 4px' }}>{it.qty}</td>
                <td style={{ textAlign: 'right', padding: '8px 4px' }}>৳{it.price.toLocaleString()}</td>
                <td style={{ textAlign: 'right', padding: '8px 4px' }}>
                  ৳{(it.qty * it.price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ padding: '8px 4px', textAlign: 'right' }} className="muted">
                Total Qty
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>{totalQty}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ marginLeft: 'auto', width: '55%' }}>
          <Row label="Products Total" value={order.amount} />
          <Row label="Delivery Charge" value={order.deliveryCharge} />
          <Row label="Grand Total" value={order.amount + order.deliveryCharge} bold />
          <Row label="Advance Paid" value={order.advance} />
          <Row label="Due" value={order.due} bold highlight />
        </div>

        <div className="muted" style={{ marginTop: 28, fontSize: 12, textAlign: 'center' }}>
          Thank you for your order!
        </div>
      </div>

      <style>{`
        @media print {
          .invoice-actions { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontWeight: bold ? 800 : 400,
        color: highlight ? '#b42318' : '#17202a',
        borderTop: bold ? '1px solid #edf0f3' : 'none',
      }}
    >
      <span>{label}</span>
      <span>৳{value.toLocaleString()}</span>
    </div>
  );
}
