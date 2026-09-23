import Link from 'next/link';
import OrderTable from '@/components/OrderTable';
import { getOrders } from '@/lib/orders';

export default async function Orders() {
  const orders = await getOrders();

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Orders</div>
          <div className="muted">Search and manage all orders</div>
        </div>

        <Link className="btn" href="/orders/new">
          + New Order
        </Link>
      </div>

      <section className="panel">
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 15,
          }}
        >
          <input
            placeholder="Search invoice, name, phone, address..."
            style={{
              flex: 1,
              border: '1px solid #d8dde5',
              borderRadius: 9,
              padding: 11,
            }}
          />

          <select
            style={{
              border: '1px solid #d8dde5',
              borderRadius: 9,
              padding: 11,
            }}
          >
            <option>All Status</option>
            <option>NEW</option>
            <option>CONFIRMED</option>
            <option>PRODUCTION</option>
            <option>READY</option>
            <option>DELIVERY</option>
            <option>DELIVERED</option>
          </select>
        </div>

        <OrderTable orders={orders} />
      </section>
    </>
  );
}
