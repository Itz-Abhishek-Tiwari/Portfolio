import { serverEnv } from '@/lib/server/env';
import { isAdmin } from '@/lib/server/auth';

const RAWG_MEDIA = 'https://media.rawg.io/media/';

// Admin-only: every poster candidate RAWG has for one game (its two backgrounds, then screenshots),
// so the studio can offer a choice. The picked URL is copied into content like the rest of the game.
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  const key = serverEnv('PORTFOLIO_RAWG_API_KEY');
  if (!key) return Response.json({ error: 'Add PORTFOLIO_RAWG_API_KEY to search RAWG.' }, { status: 501 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^\d{1,9}$/.test(id)) return Response.json({ error: 'Unknown game.' }, { status: 400 });
  const rawg = (path: string, params: Record<string, string> = {}) =>
    fetch('https://api.rawg.io/api/games/' + id + path + '?' + new URLSearchParams({ key, ...params }), {
      signal: AbortSignal.timeout(8000)
    });
  try {
    const [detail, shots] = await Promise.all([rawg(''), rawg('/screenshots', { page_size: '20' })]);
    if (!detail.ok) return Response.json({ error: 'RAWG is unavailable right now.' }, { status: 502 });
    const game = (await detail.json()) as {
      background_image?: string | null;
      background_image_additional?: string | null;
    };
    const screenshots = shots.ok
      ? (((await shots.json()) as { results?: { image: string }[] }).results ?? []).map(s => s.image)
      : [];
    const images = [game.background_image, game.background_image_additional, ...screenshots].filter(
      (url): url is string => !!url?.startsWith(RAWG_MEDIA) && url.length <= 600
    );
    return Response.json({ images: [...new Set(images)] });
  } catch {
    return Response.json({ error: 'RAWG did not respond. Try again.' }, { status: 504 });
  }
}
