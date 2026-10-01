import { daysUntil } from './date';
import { OrderStatus } from './types';

export type CountdownBadge = { text: string; bg: string; color: string };

// Mirrors isOverdue()'s exclusions (DELIVERED/CANCELLED never show a badge).
export function getDeliveryCountdown(
  deliveryDate: string,
  status: OrderStatus
): CountdownBadge | null {
  if (!deliveryDate || status === 'DELIVERED' || status === 'CANCELLED') return null;

  const days = daysUntil(deliveryDate);

  if (days < 0) return { text: 'OVERDUE', bg: '#fee2e2', color: '#b42318' };
  if (days === 0) return { text: 'Today Delivery', bg: '#dbeafe', color: '#1d4ed8' };
  if (days === 1) return { text: '1 days remaining', bg: '#fef9c3', color: '#854d0e' };
  if (days === 2) return { text: '2 days remaining', bg: '#dcfce7', color: '#166534' };
  if (days === 3) return { text: '3 days remaining', bg: '#fce7f3', color: '#9d174d' };
  return null;
}
