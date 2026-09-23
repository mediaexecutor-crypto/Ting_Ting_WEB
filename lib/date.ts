import {OrderStatus} from './types';
export function isOverdue(delivery:string,status:OrderStatus){if(status==='DELIVERED'||status==='CANCELLED')return false;const d=new Date(delivery+'T23:59:59');return d.getTime()<Date.now();}
