import { env } from 'cloudflare:workers';
import { isAdmin } from '@/lib/server/auth';
import type { GameResult } from '@/lib/games';

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  metacritic: number | null;
  genres?: { name: string }[];
  parent_platforms?: { platform: { name: string } }[];
};

// Admin-only game search on RAWG. The studio copies the picked result into content, so the public site never calls RAWG.
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  const key = (env as unknown as Record<string, string>).PORTFOLIO_RAWG_API_KEY;
  if (!key)
    return Response.json(
      { error: 'Add PORTFOLIO_RAWG_API_KEY to .dev.vars (free key at rawg.io/apidocs) to search games.' },
      { status: 501 }
    );
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 120);
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const response = await fetch(
      'https://api.rawg.io/api/games?' +
        new URLSearchParams({ key, search: q, page_size: '10', search_precise: 'true' }),
      { signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok)
      return Response.json(
        {
          error:
            response.status === 401
              ? 'RAWG rejected the API key. Check PORTFOLIO_RAWG_API_KEY.'
              : 'RAWG is unavailable right now.'
        },
        { status: 502 }
      );
    const data = (await response.json()) as { results?: RawgGame[] };
    const results: GameResult[] = (data.results ?? []).map(g => ({
      rawgId: g.id,
      slug: g.slug,
      name: g.name.slice(0, 120),
      image: g.background_image?.startsWith('https://media.rawg.io/media/') ? g.background_image : '',
      released: g.released ?? '',
      genres: (g.genres ?? [])
        .slice(0, 3)
        .map(x => x.name)
        .join(', '),
      platforms: (g.parent_platforms ?? [])
        .slice(0, 4)
        .map(x => x.platform.name)
        .join(', '),
      metacritic: g.metacritic
    }));
    return Response.json({ results });
  } catch {
    return Response.json({ error: 'RAWG did not respond. Try again.' }, { status: 504 });
  }
}
