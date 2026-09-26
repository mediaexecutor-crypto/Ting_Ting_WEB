'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderFile } from '@/lib/orderFiles';

export default function OrderFilesList({
  orderId,
  files,
}: {
  orderId: string;
  files: OrderFile[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(fileId: string, fileName: string) {
    if (!window.confirm(`Remove "${fileName}"? This deletes it from Drive too.`)) return;
    setDeletingId(fileId);
    await fetch(`/api/orders/${orderId}/files/${fileId}`, { method: 'DELETE' });
    setDeletingId(null);
    router.refresh();
  }

  if (files.length === 0) {
    return (
      <div className="muted" style={{ fontSize: 13 }}>
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div>
      {files.map((f) => (
        <div
          key={f.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 0',
            borderBottom: '1px solid #edf0f3',
          }}
        >
          {f.thumbnailUrl ? (
            <img
              src={f.thumbnailUrl}
              alt=""
              width={36}
              height={36}
              style={{ borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: '#eef1f5',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              📄
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <a
              href={f.fileUrl}
              target="_blank"
              rel="noreferrer"
              style={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {f.fileName}
            </a>
            {f.note && (
              <div className="muted" style={{ fontSize: 12 }}>
                {f.note}
              </div>
            )}
          </div>
          <button
            className="btn secondary"
            onClick={() => handleDelete(f.id, f.fileName)}
            disabled={deletingId === f.id}
            style={{ color: '#b42318', flexShrink: 0 }}
          >
            {deletingId === f.id ? '...' : 'Remove'}
          </button>
        </div>
      ))}
    </div>
  );
}
