import Link from 'next/link';
import OrderTable from '@/components/OrderTable';
import { getOrders } from '@/lib/orders';
import { getCurrentUserContext, scopeFilter } from '@/lib/auth';
import { ORDER_STATUSES } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function Orders({ searchParams }: Props) {
  const { q = '', status = '' } = await searchParams;
  const ctx = await getCurrentUserContext();
  const allOrders = await getOrders(scopeFilter(ctx));

  const needle = q.trim().toLowerCase();
  const orders = allOrders.filter((o) => {
    const matchesQuery =
      needle === '' ||
      o.invoice.toLowerCase().includes(needle) ||
      o.customer.toLowerCase().includes(needle) ||
      o.phone.toLowerCase().includes(needle) ||
      o.address.toLowerCase().includes(needle);

    const matchesStatus = status === '' || o.status === status;

    return matchesQuery && matchesStatus;
  });


// Three groups, top to bottom: everything still in progress, then orders
// that are READY / out for DELIVERY, then DELIVERED at the bottom.
// Middle group: later delivery date higher up (earliest delivery sits at the
// bottom of the group, no date = top); same date -> newest created higher.
const stageRank = (s: string) =>
  s === 'DELIVERED' ? 2 : s === 'READY' || s === 'DELIVERY' ? 1 : 0;

orders.sort((a, b) => {
  const ra = stageRank(a.status);
  const rb = stageRank(b.status);
  if (ra !== rb) return ra - rb;

  if (ra === 1) {
    const da = a.delivery || '9999-12-31';
    const db = b.delivery || '9999-12-31';
    if (da !== db) return db.localeCompare(da);
  }

  return b.createdAt.localeCompare(a.createdAt);
});
  

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
        <form
          method="get"
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 15,
          }}
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Search invoice, name, phone, address..."
            style={{
              flex: 1,
              border: '1px solid #d8dde5',
              borderRadius: 9,
              padding: 11,
            }}
          />

          <select
            name="status"
            defaultValue={status}
            style={{
              border: '1px solid #d8dde5',
              borderRadius: 9,
              padding: 11,
            }}
          >
            <option value="">All Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button className="btn" type="submit">
            Search
          </button>
          {(q || status) && (
            <Link className="btn secondary" href="/orders">
              Clear
            </Link>
          )}
        </form>

        <OrderTable orders={orders} />
        {orders.length === 0 && (
          <div className="muted" style={{ padding: 20, textAlign: 'center' }}>
            No orders match your search.
          </div>
        )}
      </section>
    </>
  );
}
