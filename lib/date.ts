import { OrderStatus } from './types';

export function isOverdue(delivery: string, status: OrderStatus) {
  if (status === 'DELIVERED' || status === 'CANCELLED') return false;
  if (!delivery) return false;
  const d = new Date(delivery + 'T23:59:59');
  return d.getTime() < Date.now();
}

// Whole days between today and the delivery date. Negative means overdue.
export function daysUntil(delivery: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(delivery + 'T00:00:00');
  const diffMs = d.getTime() - today.getTime();
  return Math.round(diffMs / 86400000);
}
