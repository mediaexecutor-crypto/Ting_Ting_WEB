import { daysUntil } from './date';
import { Order } from './types';

export type DashboardStats = {
  statusCounts: Record<string, number>;
  totalDue: number;
  buckets: {
    next3: Order[];
    next7: Order[];
    next15: Order[];
    beyond15: Order[];
  };
};

const ACTIVE_STAGES = ['NEW', 'CONFIRMED', 'DESIGN', 'PRODUCTION', 'READY', 'DELIVERY', 'DELIVERED'];

export function computeDashboardStats(orders: Order[]): DashboardStats {
  const statusCounts: Record<string, number> = {};
  for (const stage of ACTIVE_STAGES) statusCounts[stage] = 0;

  let totalDue = 0;

  const buckets: DashboardStats['buckets'] = {
    next3: [],
    next7: [],
    next15: [],
    beyond15: [],
  };

  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    totalDue += order.due;

    const isPending = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    if (isPending && order.delivery) {
      const days = daysUntil(order.delivery);
      if (days <= 3) buckets.next3.push(order);
      else if (days <= 7) buckets.next7.push(order);
      else if (days <= 15) buckets.next15.push(order);
      else buckets.beyond15.push(order);
    }
  }

  return { statusCounts, totalDue, buckets };
}
