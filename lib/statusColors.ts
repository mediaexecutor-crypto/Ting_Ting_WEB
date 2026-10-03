import { OrderStatus } from './types';

export function statusClassName(status: OrderStatus): string {
  return `status status-${status}`;
}

export function priorityClassName(priority: string): string {
  return `status priority-${priority || 'Normal'}`;
}
