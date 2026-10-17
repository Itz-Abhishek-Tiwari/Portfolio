export const MAX_UPLOAD = 8 * 1024 * 1024;
const SERVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Phone photos are often over 8 MB or in formats the server rejects (HEIC, AVIF, GIF). Re-encode
// them in the browser: scale to at most 2400px and save as WebP (JPEG where WebP is unsupported).
export async function prepareImage(file: File): Promise<File> {
  if (SERVER_TYPES.includes(file.type) && file.size <= 1.5 * 1024 * 1024) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This browser cannot read that image. Export it as JPG, PNG or WebP and try again.');
  }
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = (type: string, quality: number) =>
    new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
  const out = (await blob('image/webp', 0.88)) ?? (await blob('image/jpeg', 0.88));
  if (!out || !SERVER_TYPES.includes(out.type))
    throw new Error('The image could not be converted. Try a JPG or PNG.');
  const name = file.name.replace(/\.[^.]+$/, '') + (out.type === 'image/webp' ? '.webp' : '.jpg');
  return new File([out], name, { type: out.type });
}

/** fetch() that always resolves to parsed JSON, with a friendly error when the server sends something else. */
export async function jsonRequest(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, signal: init?.signal || AbortSignal.timeout(30000) });
  const raw = await r.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new Error('The server did not respond as expected. Your edits are safe. Try again.');
  }
  return { response: r, body };
}
