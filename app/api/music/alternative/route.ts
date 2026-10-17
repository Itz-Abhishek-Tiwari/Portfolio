import { readContent } from '@/lib/server/content-store';
import { youtubeSource } from '@/lib/music';
import {
  REGION,
  durationSeconds,
  isPlayable,
  videoDetails,
  youtubeKey,
  ytCall,
  type VideoDetails
} from '@/lib/server/youtube';

// Finds another upload of the site's song when its owner blocks embedding: the same song, at about the
// same length, that YouTube says can play here. Official Data API only; results are cached to save quota.

type Result = { id: string | null; title?: string; at: number };
const cache = new Map<string, Result>();
const FOUND_TTL = 24 * 60 * 60 * 1000;
// A miss is retried sooner: new uploads appear, and a quota blip shouldn't stick for a day.
const MISS_TTL = 60 * 60 * 1000;
const MIN_SCORE = 45;

// Versions that are a different listen from the original, unless the original is one of them too.
const VARIANTS =
  /\b(cover|remix|live|slowed|reverb|sped ?up|nightcore|8d|karaoke|instrumental|lofi|lo-fi|mashup|reaction|unplugged|acoustic|bass ?boosted)\b/i;
// Words that describe the upload, not the song.
const NOISE = new Set([
  'official',
  'video',
  'audio',
  'lyrics',
  'lyric',
  'hd',
  '4k',
  'full',
  'song',
  'music',
  'mv',
  'ft',
  'feat'
]);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter(w => w.length > 1 && !NOISE.has(w));
const artistOf = (v: VideoDetails) => v.snippet.channelTitle.replace(/ - Topic$/, '').toLowerCase();

/** 0–100: how likely a candidate is the same recording as the original. */
function score(original: VideoDetails, candidate: VideoDetails) {
  const core = [...new Set(words(original.snippet.title))];
  const title = candidate.snippet.title.toLowerCase();
  const haystack = new Set(words(candidate.snippet.title + ' ' + candidate.snippet.channelTitle));
  let points = core.length ? (core.filter(w => haystack.has(w)).length / core.length) * 60 : 30;
  const artist = artistOf(original);
  if (artist && (title.includes(artist) || artistOf(candidate) === artist)) points += 10;
  const a = durationSeconds(original.contentDetails.duration),
    b = durationSeconds(candidate.contentDetails.duration);
  if (a && b) {
    const gap = Math.abs(a - b);
    points += gap <= 4 ? 25 : gap <= 12 ? 15 : gap <= 30 ? 5 : -25;
  }
  if (VARIANTS.test(title) && !VARIANTS.test(original.snippet.title)) points -= 40;
  return points;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('v') || '';
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return Response.json({ error: 'bad-request' }, { status: 400 });
  const key = youtubeKey();
  if (!key) return Response.json({ error: 'not-configured' }, { status: 501 });
  try {
    // Only look up the song that is configured for the site, so this can't be used as a free search proxy.
    const source = youtubeSource((await readContent()).content.music.playlistUrl);
    if (source?.kind !== 'video' || source.id !== id)
      return Response.json({ error: 'not-allowed' }, { status: 403 });

    const hit = cache.get(id);
    if (hit && Date.now() - hit.at < (hit.id ? FOUND_TTL : MISS_TTL)) return Response.json(hit);

    // The original's own details work even when it can't be embedded, and carry its length for matching.
    // No shortcut back to the original: the player only asks after YouTube refused it, and some refusals
    // (age limits, label rules) don't show up in these fields.
    const original = (await videoDetails([id], key)).get(id);
    if (!original) return remember(id, { id: null, at: Date.now() });

    const search = await ytCall<{ items?: { id: { videoId: string } }[] }>(
      'search',
      {
        part: 'id',
        type: 'video',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        regionCode: REGION,
        maxResults: '12',
        q: original.snippet.title + ' ' + artistOf(original)
      },
      key
    );
    if (!search) return Response.json({ id: null }); // quota or network: don't cache
    const candidates = await videoDetails(
      (search.items ?? []).map(i => i.id.videoId).filter(v => v !== id),
      key
    );
    const best = [...candidates.values()]
      .filter(isPlayable)
      .map(v => ({ v, points: score(original, v) }))
      .sort((x, y) => y.points - x.points)[0];
    return remember(
      id,
      best && best.points >= MIN_SCORE
        ? { id: best.v.id, title: best.v.snippet.title, at: Date.now() }
        : { id: null, at: Date.now() }
    );
  } catch {
    return Response.json({ id: null });
  }
}

function remember(id: string, result: Result) {
  cache.set(id, result);
  return Response.json(result, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
