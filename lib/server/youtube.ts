import { env } from 'cloudflare:workers';

// Shared YouTube Data API helpers for the studio's song search and the public "find a playable copy" lookup.

const API = 'https://www.googleapis.com/youtube/v3/';
/** Where the site's visitors are; region-blocked videos there are treated as unplayable. */
export const REGION = 'IN';

export const youtubeKey = () =>
  (env as unknown as Record<string, string | undefined>).PORTFOLIO_YOUTUBE_API_KEY || '';

/** One Data API call. Null on any failure (bad key, quota, timeout) so callers can degrade quietly. */
export async function ytCall<T>(
  path: string,
  params: Record<string, string>,
  key: string
): Promise<T | null> {
  try {
    const response = await fetch(API + path + '?' + new URLSearchParams({ ...params, key }), {
      signal: AbortSignal.timeout(7000)
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export type VideoDetails = {
  id: string;
  snippet: { title: string; channelTitle: string };
  status: { embeddable: boolean; privacyStatus: string };
  contentDetails: { duration: string; regionRestriction?: { blocked?: string[]; allowed?: string[] } };
};

/** Details for up to 50 videos in one call (1 quota unit). */
export async function videoDetails(ids: string[], key: string) {
  if (!ids.length) return new Map<string, VideoDetails>();
  const data = await ytCall<{ items?: VideoDetails[] }>(
    'videos',
    { part: 'snippet,status,contentDetails', id: ids.slice(0, 50).join(',') },
    key
  );
  return new Map((data?.items ?? []).map(v => [v.id, v]));
}

/** Public, embeddable, and not region-blocked for our visitors. */
export function isPlayable(v: VideoDetails) {
  const region = v.contentDetails.regionRestriction;
  return (
    v.status.embeddable &&
    v.status.privacyStatus === 'public' &&
    !region?.blocked?.includes(REGION) &&
    (!region?.allowed || region.allowed.includes(REGION))
  );
}

export async function playableIds(ids: string[], key: string) {
  const details = await videoDetails(ids, key);
  return new Set([...details.values()].filter(isPlayable).map(v => v.id));
}

/** ISO 8601 duration ("PT3M42S") to seconds; 0 when unknown. */
export function durationSeconds(iso: string) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  return m ? Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0) : 0;
}
