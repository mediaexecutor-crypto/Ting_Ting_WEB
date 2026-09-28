import Link from 'next/link';
import { getOrders } from '@/lib/orders';
import { computeReportStats } from '@/lib/reports';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';
import { shiftMonth, monthLabel, currentMonthStr } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const monthStr = month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthStr();

  const ctx = await getCurrentUserContext();
  const orders = await getOrders(scopeFilter(ctx));
  const stats = computeReportStats(orders, monthStr);

  const last6 = stats.months.slice(-6);
  const maxMonthly = Math.max(1, ...last6.map((m) => m.revenue));
  const maxSource = Math.max(1, ...stats.bySource.map((s) => s.revenue));

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Reports</div>
          <div className="muted">Monthly report — counted by order confirmed date</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link className="btn secondary" href={`/reports?month=${shiftMonth(monthStr, -1)}`}>
            ← Prev
          </Link>
          <div style={{ fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
            {monthLabel(monthStr)}
          </div>
          <Link className="btn secondary" href={`/reports?month=${shiftMonth(monthStr, 1)}`}>
            Next →
          </Link>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <div className="muted">Orders Confirmed</div>
          <div className="n">{stats.monthOrders}</div>
        </div>
        <div className="card">
          <div className="muted">Total Pcs</div>
          <div className="n">{stats.monthPcs}</div>
        </div>
        <div className="card">
          <div className="muted">Revenue</div>
          <div className="n">৳{stats.monthRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="muted">Outstanding Due</div>
          <div className="n">৳{stats.monthOutstanding.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="muted">Avg Order Value</div>
          <div className="n">৳{Math.round(stats.monthAvg).toLocaleString()}</div>
        </div>
      </div>

      {stats.noConfirmDateCount > 0 && (
        <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          {stats.noConfirmDateCount} order{stats.noConfirmDateCount === 1 ? ' has' : 's have'} no
          confirmed date yet, so {stats.noConfirmDateCount === 1 ? "it isn't" : "they aren't"}{' '}
          counted in any month.
        </div>
      )}

      <div className="grid2">
        <section className="panel">
          <h3>Revenue — Last 6 Months</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 }}>
            {last6.map((m) => (
              <Link
                key={m.month}
                href={`/reports?month=${m.month}`}
                style={{ flex: 1, textAlign: 'center' }}
                title={`৳${m.revenue.toLocaleString()} · ${m.orders} orders · ${m.pcs} pcs`}
              >
                <div
                  style={{
                    height: Math.max(4, (m.revenue / maxMonthly) * 130),
                    background: m.month === monthStr ? '#1d4ed8' : '#111827',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {m.short}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Orders by Status — {monthLabel(monthStr)}</h3>
          <div className="pipeline" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {stats.byStatus.map((s) => (
              <div className="pill" key={s.status}>
                {s.status}
                <b>{s.count}</b>
              </div>
            ))}
            {stats.byStatus.length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>
                No orders confirmed this month.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <h3>Monthly Summary — Last 12 Months</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Orders</th>
              <th>Total Pcs</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {[...stats.months].reverse().map((m) => (
              <tr key={m.month} style={m.month === monthStr ? { background: '#eff6ff' } : undefined}>
                <td>
                  <Link href={`/reports?month=${m.month}`} style={{ color: '#1d4ed8', fontWeight: 700 }}>
                    {monthLabel(m.month)}
                  </Link>
                </td>
                <td>{m.orders}</td>
                <td>{m.pcs}</td>
                <td>৳{m.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: 18 }}>
        <h3>Revenue by Order Source — {monthLabel(monthStr)}</h3>
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
                  No orders confirmed this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
