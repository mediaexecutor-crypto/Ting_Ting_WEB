import Link from 'next/link';
import { getCustomersSummary } from '@/lib/customers';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Customers() {
  const ctx = await getCurrentUserContext();
  const customers = await getCustomersSummary(scopeFilter(ctx));

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Customers</div>
          <div className="muted">Customer database and order history</div>
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Pcs</th>
              <th>Total Sales</th>
              <th>Last Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                </td>
                <td>{c.phone}</td>
                <td>{c.orderCount}</td>
                <td>{c.totalPcs}</td>
                <td>৳{c.totalSales.toLocaleString()}</td>
                <td>{c.lastOrderDate || '—'}</td>
                <td>
                  <Link
                    className="btn secondary"
                    href={`/orders/new?name=${encodeURIComponent(c.name)}&phone=${encodeURIComponent(c.phone)}&address=${encodeURIComponent(c.address)}`}
                  >
                    + New Order
                  </Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 20 }}>
                  No customers yet — they appear here automatically once an order is created.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
