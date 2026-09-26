import { OrderStatus } from './types';

export function statusClassName(status: OrderStatus): string {
  return `status status-${status}`;
}
