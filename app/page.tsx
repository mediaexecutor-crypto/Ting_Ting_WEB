import OrderTable from '@/components/OrderTable';
import { getOrders } from '@/lib/orders';

export default async function Orders() {
  const orders = await getOrders();

  return (
    <main>
      <h1>Orders</h1>
      <OrderTable orders={orders} />
    </main>
  );
}
