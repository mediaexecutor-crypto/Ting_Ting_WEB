// Browser-side helper: uploads one file to an order's Drive folder by
// sending the bytes DIRECTLY to Google Drive (no size limit from our
// hosting), with our server only starting the session and recording the
// result.
export type UploadResult = { ok: true } | { ok: false; error: string };

export async function uploadFileToOrder(
  orderId: string,
  file: File,
  name: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const mimeType = file.type || 'application/octet-stream';

  // 1. Ask our server to start a Drive upload session.
  let uploadUrl: string;
  try {
    const initRes = await fetch(`/api/orders/${orderId}/files/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalName: file.name, name, mimeType, size: file.size }),
    });
    const init = await initRes.json().catch(() => ({}));
    if (!initRes.ok) return { ok: false, error: init.error ?? 'Could not start the upload.' };
    uploadUrl = init.uploadUrl;
  } catch {
    return { ok: false, error: 'Network error — please try again.' };
  }

  // 2. Send the file straight to Google Drive (XHR so we get progress).
  const put = await new Promise<{ id?: string; error?: string }>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          resolve({ id: JSON.parse(xhr.responseText).id });
        } catch {
          resolve({ error: 'Drive accepted the file but the response was unreadable.' });
        }
      } else {
        resolve({ error: `Google Drive rejected the upload (${xhr.status}).` });
      }
    };
    xhr.onerror = () => resolve({ error: 'Upload to Google Drive failed — check your connection.' });
    xhr.send(file);
  });

  if (!put.id) return { ok: false, error: put.error ?? 'Upload failed.' };

  // 3. Tell our server it's done so it can verify and record the file.
  try {
    const doneRes = await fetch(`/api/orders/${orderId}/files/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driveFileId: put.id }),
    });
    const done = await doneRes.json().catch(() => ({}));
    if (!doneRes.ok) return { ok: false, error: done.error ?? 'Could not save the file record.' };
  } catch {
    return { ok: false, error: 'Uploaded, but saving the record failed — please refresh.' };
  }

  return { ok: true };
}
