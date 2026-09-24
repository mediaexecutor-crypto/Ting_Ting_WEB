import { Order } from './types';

export type ReportStats = {
  totalOrders: number;
  totalRevenue: number;
  totalOutstanding: number;
  avgOrderValue: number;
  bySource: { source: string; count: number; revenue: number }[];
  byStatus: { status: string; count: number }[];
  monthlyRevenue: { month: string; label: string; revenue: number }[];
};

export function computeReportStats(orders: Order[]): ReportStats {
  const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');

  const totalOrders = activeOrders.length;
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalOutstanding = activeOrders
    .filter((o) => o.status !== 'DELIVERED')
    .reduce((sum, o) => sum + o.due, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const sourceMap = new Map<string, { count: number; revenue: number }>();
  for (const o of activeOrders) {
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
  for (const o of orders) {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Last 6 months, oldest first
  const now = new Date();
  const months: { month: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }

  const revenueByMonth = new Map<string, number>();
  for (const o of activeOrders) {
    if (!o.orderDate) continue;
    const key = o.orderDate.slice(0, 7);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + o.amount);
  }

  const monthlyRevenue = months.map((m) => ({
    ...m,
    revenue: revenueByMonth.get(m.month) ?? 0,
  }));

  return {
    totalOrders,
    totalRevenue,
    totalOutstanding,
    avgOrderValue,
    bySource,
    byStatus,
    monthlyRevenue,
  };
}
