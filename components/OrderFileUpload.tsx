'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderFileUpload({ orderId }: { orderId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file first.');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('note', note);

    try {
      const res = await fetch(`/api/orders/${orderId}/files`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upload failed.');
        setUploading(false);
        return;
      }

      setNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
      router.refresh();
    } catch {
      setError('Network error — please try again.');
      setUploading(false);
    }
  }

  return (
    <div>
      {error && (
        <div
          style={{
            background: '#fef3f2',
            color: '#b42318',
            border: '1px solid #fecdca',
            borderRadius: 9,
            padding: 10,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <input type="file" ref={fileInputRef} style={{ marginBottom: 8, width: '100%' }} />
      <input
        placeholder="Rename / note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        style={{
          border: '1px solid #d8dde5',
          borderRadius: 9,
          padding: 9,
          width: '100%',
          marginBottom: 8,
        }}
      />
      <button className="btn" onClick={handleUpload} disabled={uploading} style={{ width: '100%' }}>
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}
