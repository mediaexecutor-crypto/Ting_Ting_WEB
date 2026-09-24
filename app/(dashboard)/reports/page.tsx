import { getOrders } from '@/lib/orders';
import { computeReportStats } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const orders = await getOrders();
  const stats = computeReportStats(orders);

  const maxMonthly = Math.max(1, ...stats.monthlyRevenue.map((m) => m.revenue));
  const maxSource = Math.max(1, ...stats.bySource.map((s) => s.revenue));

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Reports</div>
          <div className="muted">Sales performance and breakdowns</div>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="muted">Total Orders</div>
          <div className="n">{stats.totalOrders}</div>
        </div>
        <div className="card">
          <div className="muted">Total Revenue</div>
          <div className="n">৳{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="muted">Outstanding Due</div>
          <div className="n">৳{stats.totalOutstanding.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="muted">Avg Order Value</div>
          <div className="n">৳{Math.round(stats.avgOrderValue).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid2">
        <section className="panel">
          <h3>Revenue — Last 6 Months</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {stats.monthlyRevenue.map((m) => (
              <div key={m.month} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`৳${m.revenue.toLocaleString()}`}
                  style={{
                    height: Math.max(4, (m.revenue / maxMonthly) * 130),
                    background: '#111827',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Orders by Status</h3>
          <div className="pipeline" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {stats.byStatus.map((s) => (
              <div className="pill" key={s.status}>
                {s.status}
                <b>{s.count}</b>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <h3>Revenue by Order Source</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.bySource.map((s) => (
              <tr key={s.source}>
                <td>{s.source}</td>
                <td>{s.count}</td>
                <td>৳{s.revenue.toLocaleString()}</td>
                <td style={{ width: '35%' }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: '#111827',
                      width: `${Math.max(4, (s.revenue / maxSource) * 100)}%`,
                    }}
                  />
                </td>
              </tr>
            ))}
            {stats.bySource.length === 0 && (
              <tr>
                <td colSpan={4} className="muted" style={{ padding: 20 }}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
