import { env } from 'cloudflare:workers';
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!/^[a-f0-9-]+\.(jpg|png|webp|pdf)$/.test(key)) return new Response('Not found', { status: 404 });
  if (!env.BUCKET) return new Response('Storage unavailable', { status: 503 });
  const file = await env.BUCKET.get(key);
  if (!file) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  file.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
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
