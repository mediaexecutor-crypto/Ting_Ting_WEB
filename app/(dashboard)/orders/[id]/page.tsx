import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderDetail } from '@/lib/orders';
import { getOrderFiles } from '@/lib/orderFiles';
import { getOrderFolder } from '@/lib/orderFolders';
import { getCurrentUserContext } from '@/lib/auth';
import OrderEditForm from '@/components/OrderEditForm';
import OrderFileUpload from '@/components/OrderFileUpload';
import OrderFilesList from '@/components/OrderFilesList';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const [order, files, folder, ctx] = await Promise.all([
    getOrderDetail(id),
    getOrderFiles(id),
    getOrderFolder(id),
    getCurrentUserContext(),
  ]);

  if (!order) {
    notFound();
  }

  // A SALESPERSON can't view/edit another rep's order, even by guessing
  // the URL — only the order's own creator or an ADMIN.
  if (order.salespersonId && order.salespersonId !== ctx?.id) {
    notFound();
  }

  return (
    <>
      <div className="top">
        <div>
          <div className="title">{order!.invoice || 'No Invoice'}</div>
          <div className="muted">{order!.customer}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn secondary" href={`/invoice/${id}`} target="_blank">
            View Invoice
          </Link>
          <Link className="btn secondary" href="/orders">
            ← Back to Orders
          </Link>
        </div>
      </div>

      <div className="grid2">
        <OrderEditForm order={order!} />

        <section className="panel">
          <h3>Files</h3>
          {folder && (
            <a
              href={folder.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="muted"
              style={{ fontSize: 13, display: 'block', marginBottom: 12 }}
            >
              Open Drive folder →
            </a>
          )}

          <OrderFileUpload orderId={id} />

          <div style={{ marginTop: 16 }}>
            <OrderFilesList orderId={id} files={files} />
          </div>
        </section>
      </div>
    </>
  );
}
