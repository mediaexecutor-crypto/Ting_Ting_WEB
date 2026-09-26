import Link from 'next/link';
import { getPendingDeliveries } from '@/lib/orders';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';
import { buildMonthGrid, shiftMonth, monthLabel, currentMonthStr } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function CalendarPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const monthStr = month || currentMonthStr();

  const ctx = await getCurrentUserContext();
  const orders = await getPendingDeliveries(scopeFilter(ctx));
  const days = buildMonthGrid(monthStr, orders);

  return (
    <>
      <div className="top">
        <div>
          <div className="title">Calendar</div>
          <div className="muted">Delivery due dates at a glance</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link className="btn secondary" href={`/calendar?month=${shiftMonth(monthStr, -1)}`}>
            ← Prev
          </Link>
          <div style={{ fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
            {monthLabel(monthStr)}
          </div>
          <Link className="btn secondary" href={`/calendar?month=${shiftMonth(monthStr, 1)}`}>
            Next →
          </Link>
        </div>
      </div>

      <section className="panel">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {WEEKDAYS.map((w) => (
            <div key={w} className="muted" style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
              {w}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
          }}
        >
          {days.map((d) => {
            const isOverdue = d.date < currentMonthStrDay() && d.orders.length > 0;
            return (
              <div
                key={d.date}
                style={{
                  minHeight: 96,
                  borderRadius: 10,
                  padding: 8,
                  background: d.inMonth ? '#fff' : '#fafbfc',
                  border: d.isToday ? '2px solid #111827' : '1px solid #edf0f3',
                  opacity: d.inMonth ? 1 : 0.5,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: d.isToday ? 800 : 600, marginBottom: 6 }}>
                  {d.day}
                </div>
                {d.orders.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    title={`${o.invoice} — ${o.customer}`}
                    style={{
                      fontSize: 11,
                      padding: '3px 6px',
                      borderRadius: 6,
                      marginBottom: 3,
                      background: isOverdue ? '#fef3f2' : '#eef2f7',
                      color: isOverdue ? '#b42318' : '#17202a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {o.invoice || o.customer || 'Order'}
                  </div>
                ))}
                {d.orders.length > 3 && (
                  <div className="muted" style={{ fontSize: 11 }}>
                    +{d.orders.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function currentMonthStrDay() {
  return new Date().toISOString().slice(0, 10);
}
