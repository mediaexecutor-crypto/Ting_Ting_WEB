import Link from 'next/link';
import { Order } from '@/lib/types';
import { isOverdue, formatDate } from '@/lib/date';
import StatusQuickChange from './StatusQuickChange';

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
          <th>Delivery</th>
          <th>Amount</th>
          <th>Due</th>
          <th>Status</th>
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

            <td>
              {formatDate(o.delivery)}

              {isOverdue(o.delivery, o.status) && (
                <div
                  style={{
                    color: '#b42318',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  OVERDUE
                </div>
              )}
            </td>

            <td>৳{o.amount.toLocaleString()}</td>

            <td>৳{o.due.toLocaleString()}</td>

            <td>
              <StatusQuickChange orderId={o.id} status={o.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
