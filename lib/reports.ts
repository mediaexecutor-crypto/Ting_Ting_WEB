import { Order } from './types';
import { shiftMonth, currentMonthStr } from './calendar';

export type MonthRow = {
  month: string; // YYYY-MM
  short: string; // 'Sep'
  orders: number;
  pcs: number;
  revenue: number;
};

export type ReportStats = {
  month: string;
  monthOrders: number;
  monthPcs: number;
  monthRevenue: number;
  monthAvg: number;
  monthOutstanding: number;
  bySource: { source: string; count: number; revenue: number }[];
  byStatus: { status: string; count: number }[];
  months: MonthRow[]; // last 12 months, oldest first
  noConfirmDateCount: number;
};

// Everything is counted by the order's CONFIRMED date (not created date).
// Orders without a confirmed date aren't placed in any month — they're
// tallied separately so it's clear why totals might look short.
export function computeReportStats(orders: Order[], month: string): ReportStats {
  const active = orders.filter((o) => o.status !== 'CANCELLED');
  const confirmed = active.filter((o) => o.confirmedDate);
  const noConfirmDateCount = active.length - confirmed.length;

  const thisMonth = confirmed.filter((o) => o.confirmedDate.slice(0, 7) === month);

  const monthOrders = thisMonth.length;
  const monthPcs = thisMonth.reduce((s, o) => s + o.totalQty, 0);
  const monthRevenue = thisMonth.reduce((s, o) => s + o.amount, 0);
  const monthAvg = monthOrders > 0 ? monthRevenue / monthOrders : 0;
  const monthOutstanding = thisMonth
    .filter((o) => o.status !== 'DELIVERED')
    .reduce((s, o) => s + o.due, 0);

  const sourceMap = new Map<string, { count: number; revenue: number }>();
  for (const o of thisMonth) {
    const key = o.source || 'Unknown';
    const entry = sourceMap.get(key) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += o.amount;
    sourceMap.set(key, entry);
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  const statusMap = new Map<string, number>();
  for (const o of thisMonth) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  const months: MonthRow[] = [];
  const nowMonth = currentMonthStr();
  for (let i = 11; i >= 0; i--) {
    const m = shiftMonth(nowMonth, -i);
    const [y, mm] = m.split('-').map(Number);
    const inMonth = confirmed.filter((o) => o.confirmedDate.slice(0, 7) === m);
    months.push({
      month: m,
      short: new Date(y, mm - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
      orders: inMonth.length,
      pcs: inMonth.reduce((s, o) => s + o.totalQty, 0),
      revenue: inMonth.reduce((s, o) => s + o.amount, 0),
    });
  }

  return {
    month,
    monthOrders,
    monthPcs,
    monthRevenue,
    monthAvg,
    monthOutstanding,
    bySource,
    byStatus,
    months,
    noConfirmDateCount,
  };
}
