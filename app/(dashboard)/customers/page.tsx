import { getCustomersSummary } from '@/lib/customers';

export const dynamic = 'force-dynamic';

export default async function Customers() {
  const customers = await getCustomersSummary();

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
              <th>Total Sales</th>
              <th>Outstanding</th>
              <th>Last Order</th>
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
                <td>৳{c.totalSales.toLocaleString()}</td>
                <td>৳{c.outstanding.toLocaleString()}</td>
                <td>{c.lastOrderDate || '—'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: 20 }}>
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
