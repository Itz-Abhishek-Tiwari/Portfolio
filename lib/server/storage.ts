import { get, put } from '@vercel/blob';
import { storeReady } from '@/lib/server/db';

// Uploads live in the same private Vercel Blob store as the data, under media/, and are served
// through /api/media/<key>, so stored URLs never point at Blob directly.
const PREFIX = 'media/';

export { storeReady as storageReady };

export async function putFile(key: string, body: ArrayBuffer, contentType: string) {
  await put(PREFIX + key, body, {
    access: 'private',
    contentType,
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 31536000
  });
}

export async function getFile(key: string) {
  const result = await get(PREFIX + key, { access: 'private' });
  if (!result || result.statusCode !== 200) return null;
  return { body: result.stream, contentType: result.blob.contentType };
}
