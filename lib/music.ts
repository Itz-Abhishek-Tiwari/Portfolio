// Parses the YouTube and Spotify links used by the listening corner.
const youtubeHosts = ['youtube.com', 'www.youtube.com', 'music.youtube.com', 'm.youtube.com', 'youtu.be'];
export type YouTubeSource = { kind: 'playlist' | 'video'; id: string };
export type SpotifySource = {
  type: 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
  id: string;
};

export function spotifySource(url: string): SpotifySource | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'open.spotify.com') return null;
    const match = parsed.pathname.match(
      /^(?:\/intl-[a-z-]+)?\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/
    );
    return match ? { type: match[1] as SpotifySource['type'], id: match[2] } : null;
  } catch {
    return null;
  }
}

export function youtubeSource(url: string): YouTubeSource | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:' || !youtubeHosts.includes(parsed.hostname)) return null;
    const list = parsed.searchParams.get('list');
    if (list && /^[A-Za-z0-9_-]{8,150}$/.test(list)) return { kind: 'playlist', id: list };
    const video =
      parsed.hostname === 'youtu.be'
        ? parsed.pathname.slice(1)
        : parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/')
          ? parsed.pathname.split('/')[2]
          : parsed.searchParams.get('v');
    return video && /^[A-Za-z0-9_-]{11}$/.test(video) ? { kind: 'video', id: video } : null;
  } catch {
    return null;
  }
}

export function musicSupported(url: string) {
  return !!youtubeSource(url) || !!spotifySource(url);
}

/** Embeddable player URL for a YouTube or Spotify link, or null when unsupported. */
export function musicEmbedUrl(url: string) {
  const spotify = spotifySource(url);
  if (spotify) return 'https://open.spotify.com/embed/' + spotify.type + '/' + spotify.id + '?theme=0';
  const source = youtubeSource(url);
  if (!source) return null;
  return source.kind === 'playlist'
    ? 'https://www.youtube.com/embed?listType=playlist&list=' +
        encodeURIComponent(source.id) +
        '&playsinline=1&rel=0'
    : 'https://www.youtube.com/embed/' + encodeURIComponent(source.id) + '?playsinline=1&rel=0';
}

/** Canonical page for the linked song or playlist on its own service. */
export function musicSourceUrl(url: string) {
  const spotify = spotifySource(url);
  if (spotify) return 'https://open.spotify.com/' + spotify.type + '/' + spotify.id;
  const source = youtubeSource(url);
  if (!source) return 'https://www.youtube.com';
  return source.kind === 'playlist'
    ? 'https://www.youtube.com/playlist?list=' + source.id
    : 'https://www.youtube.com/watch?v=' + source.id;
}

/** Whether the listening corner should be offered to visitors. */
export function hasMusic(music: { enabled: boolean; playlistUrl: string }) {
  return music.enabled && musicSupported(music.playlistUrl);
}
