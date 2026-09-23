import { getPendingDeliveries } from '@/lib/orders';
import { isOverdue } from '@/lib/date';
import CopyDeliveryButton from '@/components/CopyDeliveryButton';

export const dynamic = 'force-dynamic';

export default async function Deliveries() {
  const orders = await getPendingDeliveries();

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Deliveries</div>
          <div className="muted">Delivery queue, overdue orders and courier actions</div>
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.invoice}</td>
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
                <td colSpan={7} className="muted" style={{ padding: 20 }}>
                  Nothing pending — every order is delivered or cancelled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
