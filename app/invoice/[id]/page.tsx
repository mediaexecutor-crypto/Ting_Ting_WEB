import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/lib/orders';
import { getCurrentUserContext } from '@/lib/auth';
import InvoiceView from '@/components/InvoiceView';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const [order, ctx] = await Promise.all([getOrderDetail(id), getCurrentUserContext()]);

  if (!order) {
    notFound();
  }

  if (order.salespersonId && order.salespersonId !== ctx?.id) {
    notFound();
  }

  return <InvoiceView order={order!} />;
}
