import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/lib/orders';
import InvoiceView from '@/components/InvoiceView';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  return <InvoiceView order={order!} />;
}
