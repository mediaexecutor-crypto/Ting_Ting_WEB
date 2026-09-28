'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileDropzone, { PendingFile } from './FileDropzone';
import { uploadFileToOrder } from '@/lib/clientUpload';

export default function OrderFileUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<PendingFile[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = uploadingId !== null;

  async function uploadOne(item: PendingFile): Promise<boolean> {
    setUploadingId(item.id);
    setErrors((e) => {
      const { [item.id]: _removed, ...rest } = e;
      return rest;
    });

    setPercent(0);
    const result = await uploadFileToOrder(orderId, item.file, item.name, setPercent);

    if (!result.ok) {
      setErrors((e) => ({ ...e, [item.id]: result.error }));
      setUploadingId(null);
      return false;
    }

    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    setUploadingId(null);
    router.refresh();
    return true;
  }

  // One at a time on purpose: the first upload may create the order's
  // Drive folder, and parallel uploads could race to create it twice.
  async function uploadAll() {
    for (const item of [...items]) {
      await uploadOne(item);
    }
  }

  return (
    <div>
      <FileDropzone
        items={items}
        onChange={setItems}
        disabled={busy}
        renderAction={(item) => (
          <button className="btn" onClick={() => uploadOne(item)} disabled={busy}>
            {uploadingId === item.id ? `Uploading ${percent}%` : 'Upload'}
          </button>
        )}
      />

      {items.map(
        (item) =>
          errors[item.id] && (
            <div key={item.id} style={{ color: '#b42318', fontSize: 12, marginTop: 4 }}>
              {item.file.name}: {errors[item.id]}
            </div>
          )
      )}

      {items.length > 1 && (
        <button className="btn" onClick={uploadAll} disabled={busy} style={{ marginTop: 12, width: '100%' }}>
          {busy ? 'Uploading...' : `Upload All (${items.length})`}
        </button>
      )}
    </div>
  );
}
