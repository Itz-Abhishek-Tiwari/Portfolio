import { getFile, storageReady } from '@/lib/server/storage';

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]+\.(jpg|png|webp|pdf)$/.test(key)) return new Response('Not found', { status: 404 });
  if (!storageReady()) return new Response('Storage unavailable', { status: 503 });
  let file: Awaited<ReturnType<typeof getFile>>;
  try {
    file = await getFile(key);
  } catch {
    return new Response('Storage unavailable', { status: 503 });
  }
  if (!file) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  if (file.contentType) headers.set('Content-Type', file.contentType);
  // Keys are random and never reused, so the CDN (s-maxage) and browsers can keep files for a year.
  headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  // ?download=Name.pdf saves the file under a readable name instead of its storage key;
  // ?name=Name.pdf shows it inline under that name (the résumé preview's viewer and its save button).
  const query = new URL(request.url).searchParams;
  const name = query.get('download') || query.get('name');
  const safe = name
    ?.replace(/[^\w .()-]/g, '')
    .trim()
    .slice(0, 80);
  if (safe)
    headers.set(
      'Content-Disposition',
      `${query.has('download') ? 'attachment' : 'inline'}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
    );
  return new Response(file.body, { headers });
}
