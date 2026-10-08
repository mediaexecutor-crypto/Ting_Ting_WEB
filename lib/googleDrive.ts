import https from 'node:https';

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID ?? '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI ?? '').trim();

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }>;
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }

  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getGoogleUserEmail(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google user info: ${await res.text()}`);
  }
  const data = await res.json();
  return data.email as string;
}

export async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId?: string
) {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create Drive folder: ${await res.text()}`);
  }

  const data = await res.json();
  return { id: data.id as string, url: `https://drive.google.com/drive/folders/${data.id}` };
}

export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array
) {
  const metadata = { name: fileName, parents: [folderId] };
  const boundary = 'cods_oms_boundary_' + Math.random().toString(16).slice(2);

  const metadataPart =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const body = Buffer.concat([
    Buffer.from(metadataPart, 'utf8'),
    Buffer.from(bytes),
    Buffer.from(`\r\n--${boundary}--`, 'utf8'),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to upload file to Drive: ${await res.text()}`);
  }

  return res.json() as Promise<{ id: string; webViewLink: string; thumbnailLink?: string }>;
}

export async function deleteFileFromDrive(accessToken: string, fileId: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 404 just means it's already gone — fine either way.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete Drive file: ${await res.text()}`);
  }
}

// ---------------------------------------------------------------------
// Direct-from-browser uploads (no file bytes pass through our server, so
// Vercel's ~4.5 MB request-body limit doesn't apply).
//
// 1. The server starts a Drive "resumable upload session" using the
//    person's access token and hands the browser only the session URL.
// 2. The browser PUTs the file straight to that URL.
// 3. The server then verifies the file in Drive and records it.
//
// The session is started with an Origin header so Google allows the
// browser's cross-origin PUT. Uses node:https because fetch treats
// Origin as a header we may not be able to set.
// ---------------------------------------------------------------------
export function initResumableUpload(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  size: number,
  origin: string
): Promise<string> {
  const body = JSON.stringify({ name: fileName, parents: [folderId] });

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink,thumbnailLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'Content-Length': Buffer.byteLength(body),
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': String(size),
          Origin: origin,
        },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => {
          const location = res.headers.location;
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && location) {
            resolve(location);
          } else {
            reject(new Error(`Failed to start Drive upload (${res.statusCode}): ${text}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function getDriveFileMeta(accessToken: string, fileId: string) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,thumbnailLink,parents`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    throw new Error(`Failed to read Drive file: ${await res.text()}`);
  }
  return res.json() as Promise<{
    id: string;
    name: string;
    webViewLink: string;
    thumbnailLink?: string;
    parents?: string[];
  }>;
}

// Makes a file publicly viewable via its direct link (anyone with the
// link can read, no Google sign-in needed) — used so thumbnails/images
// actually render on the public share page and in the order file list.
export async function makeFilePublic(accessToken: string, fileId: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  if (!res.ok) {
    console.error('Failed to make file public:', await res.text());
  }
}
