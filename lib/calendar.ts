import { Order } from './types';

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  day: number;
  inMonth: boolean;
  isToday: boolean;
  orders: Order[];
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Builds a 6-week (42 day) grid for the given YYYY-MM month, Sunday-first,
// with each pending order attached to the day it's due.
export function buildMonthGrid(monthStr: string, orders: Order[]): CalendarDay[] {
  const [year, month] = monthStr.split('-').map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday

  const gridStart = new Date(year, month - 1, 1 - startOffset);
  const todayStr = toDateStr(new Date());

  const ordersByDate = new Map<string, Order[]>();
  for (const order of orders) {
    if (!order.delivery) continue;
    const list = ordersByDate.get(order.delivery) ?? [];
    list.push(order);
    ordersByDate.set(order.delivery, list);
  }

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dateStr = toDateStr(d);

    days.push({
      date: dateStr,
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
      isToday: dateStr === todayStr,
      orders: ordersByDate.get(dateStr) ?? [],
    });
  }

  return days;
}

export function shiftMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
