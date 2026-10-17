import { supabaseConfig, supabaseHeaders } from '@/lib/server/supabase';

// Uploads live in a private Supabase Storage bucket (created by database/004_storage.sql) and are
// served through /api/media/<key>, so stored URLs never point at Supabase directly.
const BUCKET = 'media';

export const storageReady = () => Boolean(supabaseConfig());

export async function putFile(key: string, body: ArrayBuffer, contentType: string) {
  const { url, key: secret } = supabaseConfig()!;
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'POST',
    headers: supabaseHeaders(secret, { 'Content-Type': contentType, 'Cache-Control': '31536000' }),
    body,
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error('Storage upload failed with ' + response.status);
}

export async function getFile(key: string) {
  const { url, key: secret } = supabaseConfig()!;
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${key}`, {
    headers: supabaseHeaders(secret),
    signal: AbortSignal.timeout(12000)
  });
  // Storage answers a missing object with 400 or 404 depending on version.
  if (response.status === 400 || response.status === 404) return null;
  if (!response.ok || !response.body) throw new Error('Storage read failed with ' + response.status);
  return { body: response.body, contentType: response.headers.get('content-type') };
}
