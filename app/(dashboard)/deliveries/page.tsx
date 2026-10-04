import { getDeliveryQueue } from '@/lib/orders';
import { formatDate } from '@/lib/date';
import DeliveryBadge from '@/components/DeliveryBadge';
import StatusQuickChange from '@/components/StatusQuickChange';
import CopyDeliveryButton from '@/components/CopyDeliveryButton';
import CourierQuickChange from '@/components/CourierQuickChange';
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
              <th>Courier</th>
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
                  {o.delivery ? formatDate(o.delivery) : '—'}
                  <DeliveryBadge deliveryDate={o.delivery} status={o.status} />
                </td>
                <td>
                  <StatusQuickChange orderId={o.id} status={o.status} />
                </td>
                <td>
                  <CourierQuickChange orderId={o.id} courier={o.courier} compact />
                </td>
                <td>
                  <CopyDeliveryButton
                    invoice={o.invoice}
                    name={o.customer}
                    phone={o.phone}
                    address={o.address}
                    cod={o.due}
                    deliveryChargeSet={o.deliveryChargeSet}
                  />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="muted" style={{ padding: 20 }}>
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
