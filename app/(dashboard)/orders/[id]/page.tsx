import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/lib/orders';
import { getOrderFiles } from '@/lib/orderFiles';
import { getOrderFolder } from '@/lib/orderFolders';
import { isOverdue } from '@/lib/date';
import OrderFileUpload from '@/components/OrderFileUpload';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  const files = await getOrderFiles(id);
  const folder = await getOrderFolder(id);

  return (
    <>
      <div className="top">
        <div>
          <div className="title">{order!.invoice}</div>
          <div className="muted">{order!.customer}</div>
        </div>
        <Link className="btn secondary" href="/orders">
          ← Back to Orders
        </Link>
      </div>

      <div className="grid2">
        <section className="panel">
          <h3>Order Info</h3>
          <table className="table">
            <tbody>
              <tr>
                <td className="muted">Status</td>
                <td>
                  <span className="status">{order!.status}</span>
                </td>
              </tr>
              <tr>
                <td className="muted">Phone</td>
                <td>{order!.phone}</td>
              </tr>
              <tr>
                <td className="muted">Address</td>
                <td>{order!.address || '—'}</td>
              </tr>
              <tr>
                <td className="muted">Delivery Date</td>
                <td>
                  {order!.delivery || '—'}
                  {order!.delivery && isOverdue(order!.delivery, order!.status) && (
                    <span style={{ color: '#b42318', fontWeight: 700, marginLeft: 8 }}>
                      OVERDUE
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="muted">Source</td>
                <td>{order!.source || '—'}</td>
              </tr>
              <tr>
                <td className="muted">Products Total</td>
                <td>৳{order!.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="muted">Delivery Charge</td>
                <td>৳{order!.deliveryCharge.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="muted">Advance Paid</td>
                <td>৳{order!.advance.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="muted">Due</td>
                <td>
                  <b>৳{order!.due.toLocaleString()}</b>
                </td>
              </tr>
              {order!.notes && (
                <tr>
                  <td className="muted">Notes</td>
                  <td>{order!.notes}</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3 style={{ marginTop: 22 }}>Products</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {order!.items.map((it) => (
                <tr key={it.id}>
                  <td>{it.product}</td>
                  <td>{it.qty}</td>
                  <td>৳{it.price.toLocaleString()}</td>
                </tr>
              ))}
              {order!.items.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    No products listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h3>Files</h3>
          {folder && (
            <a
              href={folder.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="muted"
              style={{ fontSize: 13, display: 'block', marginBottom: 12 }}
            >
              Open Drive folder →
            </a>
          )}

          <OrderFileUpload orderId={id} />

          <div style={{ marginTop: 16 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #edf0f3',
                }}
              >
                <a href={f.fileUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                  {f.fileName}
                </a>
                {f.note && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    {f.note}
                  </div>
                )}
              </div>
            ))}
            {files.length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>
                No files uploaded yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
