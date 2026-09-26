import { getDeliveryQueue } from '@/lib/orders';
import { isOverdue } from '@/lib/date';
import { statusClassName } from '@/lib/statusColors';
import CopyDeliveryButton from '@/components/CopyDeliveryButton';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Deliveries() {
  const ctx = await getCurrentUserContext();
  const orders = await getDeliveryQueue(scopeFilter(ctx));

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Deliveries</div>
          <div className="muted">Orders that are Ready, out for Delivery, or Delivered</div>
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>COD</th>
              <th>Delivery</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.invoice || 'No Invoice'}</td>
                <td>{o.customer}</td>
                <td>{o.phone}</td>
                <td>{o.address || '—'}</td>
                <td>৳{o.due.toLocaleString()}</td>
                <td>
                  {o.delivery || '—'}
                  {o.delivery && isOverdue(o.delivery, o.status) && (
                    <div style={{ color: '#b42318', fontWeight: 700 }}>OVERDUE</div>
                  )}
                </td>
                <td>
                  <span className={statusClassName(o.status)}>{o.status}</span>
                </td>
                <td>
                  <CopyDeliveryButton
                    invoice={o.invoice}
                    name={o.customer}
                    phone={o.phone}
                    address={o.address}
                    cod={o.due}
                  />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ padding: 20 }}>
                  Nothing here yet — orders show up once they reach Ready status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
