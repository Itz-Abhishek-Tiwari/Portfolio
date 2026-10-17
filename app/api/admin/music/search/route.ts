import { isAdmin } from '@/lib/server/auth';
import { playableIds, youtubeKey, ytCall as call } from '@/lib/server/youtube';

type Snippet = { title: string; channelTitle: string; thumbnails?: { medium?: { url: string } } };
const MIN_PLAYABLE_SHARE = 0.8;

// Admin-only song search. Only returns songs and playlists YouTube says can be embedded and played.
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  const key = youtubeKey();
  if (!key)
    return Response.json({ error: 'Add PORTFOLIO_YOUTUBE_API_KEY to enable song search.' }, { status: 501 });
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 120);
  if (q.length < 2) return Response.json({ results: [] });
  try {
    const [videoSearch, playlistSearch] = await Promise.all([
      call<{ items?: { id: { videoId: string }; snippet: Snippet }[] }>(
        'search',
        {
          part: 'snippet',
          type: 'video',
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          maxResults: '15',
          q
        },
        key
      ),
      call<{ items?: { id: { playlistId: string }; snippet: Snippet }[] }>(
        'search',
        { part: 'snippet', type: 'playlist', maxResults: '6', q },
        key
      )
    ]);
    if (!videoSearch && !playlistSearch)
      return Response.json({ error: 'YouTube search failed. Check the API key and quota.' }, { status: 502 });
    const videos = videoSearch?.items ?? [];
    const playlists = playlistSearch?.items ?? [];

    // For each playlist, sample its first songs and keep it only if nearly all of them can play.
    const samples = await Promise.all(
      playlists.map(async p => {
        const data = await call<{ items?: { contentDetails: { videoId: string } }[] }>(
          'playlistItems',
          { part: 'contentDetails', playlistId: p.id.playlistId, maxResults: '8' },
          key
        );
        return (data?.items ?? []).map(i => i.contentDetails.videoId);
      })
    );
    const okIds = await playableIds([...new Set([...videos.map(v => v.id.videoId), ...samples.flat()])], key);

    const thumb = (s: Snippet) => s.thumbnails?.medium?.url ?? '';
    return Response.json({
      results: [
        ...videos
          .filter(v => okIds.has(v.id.videoId))
          .map(v => ({
            kind: 'video' as const,
            id: v.id.videoId,
            title: v.snippet.title,
            channel: v.snippet.channelTitle,
            thumbnail: thumb(v.snippet)
          })),
        ...playlists
          .filter((_, i) => {
            const ids = samples[i];
            return (
              ids.length > 0 && ids.filter(id => okIds.has(id)).length / ids.length >= MIN_PLAYABLE_SHARE
            );
          })
          .map(p => ({
            kind: 'playlist' as const,
            id: p.id.playlistId,
            title: p.snippet.title,
            channel: p.snippet.channelTitle,
            thumbnail: thumb(p.snippet)
          }))
      ]
    });
  } catch {
    return Response.json({ error: 'Song search is unavailable.' }, { status: 503 });
  }
}
