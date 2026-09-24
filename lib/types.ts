export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'DESIGN'
  | 'PRODUCTION'
  | 'READY'
  | 'DELIVERY'
  | 'DELIVERED'
  | 'ON_HOLD'
  | 'CANCELLED';

export const ORDER_STATUSES: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'DESIGN',
  'PRODUCTION',
  'READY',
  'DELIVERY',
  'DELIVERED',
  'ON_HOLD',
  'CANCELLED',
];

export type Order = {
  id: string;
  invoice: string;
  customer: string;
  phone: string;
  address: string;
  delivery: string;
  orderDate: string;
  source: string;
  amount: number;
  deliveryCharge: number;
  advance: number;
  due: number;
  status: OrderStatus;
};

export type NewOrderItem = {
  product: string;
  qty: number;
  price: number;
};

export type NewOrderPayload = {
  customerName: string;
  phone: string;
  address: string;
  invoice: string;
  deliveryDate: string;
  source: string;
  priority: string;
  items: NewOrderItem[];
  deliveryCharge: number;
  advance: number;
  notes: string;
};
