'use client';
import { useEffect, useState } from 'react';
import { loadYouTubeApi } from '@/components/music/youtube-api';
import { Search } from 'lucide-react';

type Result = { kind: 'video' | 'playlist'; id: string; title: string; channel: string; thumbnail: string };

type Check = 'checking' | 'ok' | 'blocked';

// Loads a song in a hidden YouTube player to find out whether YouTube will really play it here.
function probe(id: string): Promise<boolean> {
  return new Promise(resolve => {
    let done = false;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:200px;height:200px;overflow:hidden';
    const node = document.createElement('div');
    host.appendChild(node);
    document.body.appendChild(host);
    let player: { destroy: () => void } | null = null;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try {
        player?.destroy();
      } catch {}
      host.remove();
      resolve(ok);
    };
    loadYouTubeApi()
      .then(api => {
        player = new api.Player(node, {
          width: 200,
          height: 200,
          videoId: id,
          playerVars: { playsinline: 1, origin: location.origin },
          events: {
            onReady: () => setTimeout(() => finish(true), 2000),
            onError: () => finish(false)
          }
        });
      })
      .catch(() => finish(true));
    setTimeout(() => finish(false), 10000);
  });
}

export default function MusicSearch({
  onPick,
  initialTerm = '',
  placeholder = 'Search a song, artist or playlist…',
  videosOnly = false
}: {
  onPick: (url: string, title: string) => void;
  initialTerm?: string;
  placeholder?: string;
  /** Hide playlists, e.g. when picking a single clip. */
  videosOnly?: boolean;
}) {
  const [term, setTerm] = useState(initialTerm);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Record<string, Check>>({});

  // Test songs a few at a time so blocked ones can be hidden.
  useEffect(() => {
    if (!results) return;
    let current = true;
    const queue = results.filter(r => r.kind === 'video').map(r => r.id);
    const worker = async () => {
      for (let id = queue.shift(); id && current; id = queue.shift()) {
        const ok = await probe(id);
        if (current) setChecks(c => ({ ...c, [id]: ok ? 'ok' : 'blocked' }));
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => {
      current = false;
    };
  }, [results]);
  const visible = results?.filter(r => (r.kind === 'playlist' ? !videosOnly : checks[r.id] !== 'blocked'));
  const checking = Object.values(checks).filter(c => c === 'checking').length;

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (term.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/music/search?q=' + encodeURIComponent(term.trim()));
      const data = (await response.json()) as { results?: Result[]; error?: string };
      if (!response.ok) setError(data.error || 'Search failed.');
      const found = response.ok ? (data.results ?? []) : null;
      setChecks(
        Object.fromEntries(
          (found ?? []).filter(r => r.kind === 'video').map(r => [r.id, 'checking' as Check])
        )
      );
      setResults(found);
    } catch {
      setError('Search failed. Check your connection.');
    }
    setBusy(false);
  }

  return (
    <div className="music-search">
      <form onSubmit={search} className="music-search-form">
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder={placeholder}
          aria-label="Search for a song"
        />
        <button className="outline-button" type="submit" disabled={busy}>
          <Search size={14} />
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && (
        <p className="studio-status error" role="alert">
          {error}
        </p>
      )}
      {checking > 0 && <p className="studio-info">Checking which songs can play… {checking} left</p>}
      {results && !checking && !visible?.length && (
        <p className="studio-info">No playable songs or playlists found. Try different words.</p>
      )}
      {!!visible?.length && (
        <ul className="music-results">
          {visible.map(r => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() =>
                  onPick(
                    r.kind === 'playlist'
                      ? 'https://www.youtube.com/playlist?list=' + r.id
                      : 'https://www.youtube.com/watch?v=' + r.id,
                    r.title
                  )
                }
              >
                {r.thumbnail && <img src={r.thumbnail} alt="" width={96} height={54} loading="lazy" />}
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.kind === 'playlist'
                      ? 'Playlist · '
                      : checks[r.id] === 'ok'
                        ? 'Song · ✓ plays · '
                        : 'Song · checking · '}
                    {r.channel}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
