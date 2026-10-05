import Link from 'next/link';
import { Order } from '@/lib/types';
import { formatDate } from '@/lib/date';
import DeliveryBadge from './DeliveryBadge';
import StatusQuickChange from './StatusQuickChange';
import { priorityClassName } from '@/lib/statusColors';

type OrderTableProps = {
  orders?: Order[];
};

export default function OrderTable({ orders = [] }: OrderTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>Confirmed</th>
          <th>Delivery</th>
          <th>Amount</th>
          <th>Due</th>
          <th>Status</th>
          <th>Priority</th>
        </tr>
      </thead>

      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <Link href={`/orders/${o.id}`} style={{ fontWeight: 700, color: '#1d4ed8' }}>
                {o.invoice || 'No Invoice'}
              </Link>
            </td>

            <td>{o.customer}</td>

            <td>{o.phone}</td>

            <td>{o.confirmedDate ? formatDate(o.confirmedDate) : '—'}</td>

            <td>{o.confirmedDate ? formatDate(o.confirmedDate) : '—'}</td>

            <td>
              {formatDate(o.delivery)}
              <DeliveryBadge deliveryDate={o.delivery} status={o.status} />
            </td>

            <td>৳{o.amount.toLocaleString()}</td>

            <td>৳{o.due.toLocaleString()}</td>

            <td>
              <StatusQuickChange orderId={o.id} status={o.status} />
            </td>

            <td><span className={priorityClassName(o.priority)}>{o.priority}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
