export type OrderStatus='NEW'|'CONFIRMED'|'DESIGN'|'PRODUCTION'|'READY'|'DELIVERY'|'DELIVERED'|'ON_HOLD'|'CANCELLED';
export type Order={id:string;invoice:string;customer:string;phone:string;delivery:string;amount:number;due:number;status:OrderStatus};
