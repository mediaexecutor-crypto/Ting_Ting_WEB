import Link from 'next/link';
import OrderTable from '@/components/OrderTable';
import { getOrders } from '@/lib/orders';
import { computeDashboardStats } from '@/lib/dashboard';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const ctx = await getCurrentUserContext();
  const orders = await getOrders(scopeFilter(ctx));
  const stats = computeDashboardStats(orders);

  const statCards: { label: string; value: number }[] = [
    { label: 'New', value: stats.statusCounts.NEW ?? 0 },
    { label: 'Confirmed', value: stats.statusCounts.CONFIRMED ?? 0 },
    {
      label: 'In Production',
      value: (stats.statusCounts.DESIGN ?? 0) + (stats.statusCounts.PRODUCTION ?? 0),
    },
    { label: 'Ready', value: stats.statusCounts.READY ?? 0 },
    { label: 'Out for Delivery', value: stats.statusCounts.DELIVERY ?? 0 },
    { label: 'Delivered', value: stats.statusCounts.DELIVERED ?? 0 },
  ];

  const deliveryBuckets = [
    { label: 'Next 3 Days', count: stats.buckets.next3.length },
    { label: 'Next 7 Days', count: stats.buckets.next7.length },
    { label: 'Next 15 Days', count: stats.buckets.next15.length },
    { label: '15+ Days', count: stats.buckets.beyond15.length },
  ];

  const recentOrders = orders.slice(0, 8);

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Dashboard</div>
          <div className="muted">Order pipeline and delivery outlook</div>
        </div>
        <Link className="btn" href="/orders/new">
          + New Order
        </Link>
      </div>

      <div className="cards">
        {statCards.map((c) => (
          <div className="card" key={c.label}>
            <div className="muted">{c.label}</div>
            <div className="n">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid2">
        <section className="panel">
          <h3>Recent Orders</h3>
          <OrderTable orders={recentOrders} />
          <div style={{ marginTop: 14 }}>
            <Link className="btn secondary" href="/orders">
              View all orders →
            </Link>
          </div>
        </section>

        <section className="panel">
          <h3>Upcoming Deliveries</h3>
          <div className="pipeline">
            {deliveryBuckets.map((b) => (
              <div className="pill" key={b.label}>
                {b.label}
                <b>{b.count}</b>
              </div>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
            Counts exclude delivered and cancelled orders.
          </div>
        </section>
      </div>
    </>
  );
}
