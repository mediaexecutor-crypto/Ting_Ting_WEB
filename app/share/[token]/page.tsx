import { notFound } from 'next/navigation';
import { getOrderIdByShareToken, getOrderDetail } from '@/lib/orders';
import { getOrderFiles } from '@/lib/orderFiles';
import { getOdooContactUrl } from '@/lib/odoo';
import { formatDate } from '@/lib/date';
import { statusClassName } from '@/lib/statusColors';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export default async function SharedOrderPage({ params }: Props) {
  const { token } = await params;
  const orderId = await getOrderIdByShareToken(token);
  if (!orderId) notFound();

  const order = await getOrderDetail(orderId);
  if (!order) notFound();

  const [files, odooUrl] = await Promise.all([
    getOrderFiles(orderId),
    getOdooContactUrl(order.customerId),
  ]);

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 12, padding: 24 }}>
        {/* Top: name, Odoo link, alternative number */}
        <div style={{ borderBottom: '1px solid #edf0f3', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{order.customer || '—'}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {[order.phone, order.address].filter(Boolean).join(' · ') || '—'}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, fontSize: 14 }}>
            {odooUrl && (
              <a href={odooUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontWeight: 700 }}>
                🔗 Odoo Contact
              </a>
            )}
            {order.alternativeNumber && (
              <span className="muted">CC Number: {order.alternativeNumber}</span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          {/* Left: order data */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{order.invoice || 'No Invoice'}</div>
              <span className={statusClassName(order.status)}>{order.status}</span>
            </div>

            <table className="table">
              <tbody>
                <tr>
                  <td className="muted">Delivery Date</td>
                  <td>{order.delivery ? formatDate(order.delivery) : '—'}</td>
                </tr>
                <tr>
                  <td className="muted">Priority</td>
                  <td>{order.priority || 'Normal'}</td>
                </tr>
                <tr>
                  <td className="muted">Delivery Charge</td>
                  <td>
                    ৳{order.deliveryCharge.toLocaleString()}
                    {order.courier ? ` (${order.courier})` : ''}
                  </td>
                </tr>
                <tr>
                  <td className="muted">Due</td>
                  <td>৳{order.due.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: 20 }}>Products</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
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
              </tbody>
            </table>

            {order.productNotes && (
              <div style={{ marginTop: 16 }}>
                <div className="muted" style={{ fontSize: 12 }}>PRODUCT DETAILS</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{order.productNotes}</div>
              </div>
            )}
          </div>

          {/* Right: files */}
          <div>
            <h3 style={{ marginTop: 0 }}>Files</h3>
            {files.length === 0 && <div className="muted">No files uploaded.</div>}
            {files.map((f) => (
              <div key={f.id} style={{ marginBottom: 16 }}>
                {f.imageUrl ? (
                  <a href={f.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={f.imageUrl}
                      alt={f.fileName}
                      style={{ width: '100%', maxWidth: 260, borderRadius: 8, display: 'block' }}
                    />
                  </a>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 220,
                      height: 120,
                      background: '#eef1f5',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 32,
                    }}
                  >
                    📄
                  </div>
                )}
                <div style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>{f.fileName}</div>
                <a href={f.fileUrl} target="_blank" rel="noreferrer" className="btn secondary" style={{ marginTop: 4, display: 'inline-block' }}>
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
