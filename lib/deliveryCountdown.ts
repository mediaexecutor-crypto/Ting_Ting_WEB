import { daysUntil } from './date';
import { OrderStatus } from './types';

export type CountdownBadge = { text: string; bg: string; color: string; blink?: boolean };

// Mirrors isOverdue()'s exclusions (DELIVERED/CANCELLED never show a badge).
export function getDeliveryCountdown(
  deliveryDate: string,
  status: OrderStatus
): CountdownBadge | null {
  if (!deliveryDate || status === 'DELIVERED' || status === 'CANCELLED') return null;

  const days = daysUntil(deliveryDate);

  if (days < 0) return { text: 'OVERDUE', bg: '#fee2e2', color: '#dc2626' };
  if (days === 0) return { text: 'Today Delivery', bg: '#fee2e2', color: '#dc2626', blink: true };
  if (days === 1) return { text: '1 days remaining', bg: '#fce7f3', color: '#9d174d' };
  if (days === 2) return { text: '2 days remaining', bg: '#fef9c3', color: '#854d0e' };
  if (days === 3) return { text: '3 days remaining', bg: '#ede9fe', color: '#6d28d9' };
  return null;
}
