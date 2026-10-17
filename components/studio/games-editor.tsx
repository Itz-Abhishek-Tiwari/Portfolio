'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Search, Trash2, Gamepad2, Music2, Play, Square } from 'lucide-react';
import type { Content } from '@/lib/content';
import { gameCover, type Game, type GameResult, type GameSound } from '@/lib/games';
import { youtubeSource } from '@/lib/music';
import { onGameSound, toggleGameSound, type GameSoundStatus } from '@/components/music/game-sound';
import MusicSearch from './music-search';

const MAX_GAMES = 12;
const year = (released: string) => released.slice(0, 4);
const clock = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
/** Accepts "1:23" or "83"; anything else reads as 0. */
function seconds(value: string) {
  const parts = value.trim().split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n) || n < 0)) return 0;
  return Math.min(36000, Math.floor(parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]));
}

/** Best embeddable YouTube video for "<game> OST main theme"; null when nothing suitable turns up. */
async function findTheme(name: string): Promise<GameSound | null> {
  const response = await fetch('/api/admin/music/search?q=' + encodeURIComponent(name + ' OST main theme'));
  const data = (await response.json()) as {
    results?: { kind: string; id: string; title: string }[];
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || 'YouTube search failed.');
  const videos = data.results?.filter(r => r.kind === 'video') ?? [];
  // Prefer actual music over trailers and gameplay videos.
  const video = videos.find(r => /theme|ost|soundtrack|music|score/i.test(r.title)) ?? videos[0];
  return video ? { videoId: video.id, start: 0, title: video.title.slice(0, 200) } : null;
}

/** Pick a YouTube clip of the game's theme, set where it starts, and preview the few seconds visitors hear. */
function GameSoundField({
  game,
  finding,
  onChange
}: {
  game: Game;
  finding: boolean;
  onChange: (patch: Pick<Game, 'sound' | 'soundOff'>) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<GameSoundStatus>('idle');
  const [start, setStart] = useState(game.sound ? clock(game.sound.start) : '0:00');
  useEffect(() => onGameSound((key, next) => setStatus(key === game.id ? next : 'idle')), [game.id]);
  const sound = game.sound;
  return (
    <div className="games-sound">
      <span className="games-sound-label">
        <Music2 size={14} /> Sound on click
      </span>
      {sound ? (
        <div className="games-sound-row">
          <span className="games-sound-title" title={sound.title}>
            {sound.title || 'YouTube clip'}
          </span>
          <label className="games-sound-start">
            <span>Starts at</span>
            <input
              value={start}
              inputMode="numeric"
              aria-label="Start time, minutes:seconds"
              onChange={e => setStart(e.target.value)}
              onBlur={() => {
                const at = seconds(start);
                setStart(clock(at));
                onChange({ sound: { ...sound, start: at }, soundOff: false });
              }}
            />
          </label>
          <button
            type="button"
            className="outline-button"
            onClick={() => void toggleGameSound(game.id, { ...sound, start: seconds(start) })}
          >
            {status === 'playing' || status === 'loading' ? <Square size={13} /> : <Play size={13} />}
            {status === 'loading'
              ? 'Loading…'
              : status === 'playing'
                ? 'Stop'
                : status === 'error'
                  ? 'Can’t play'
                  : 'Preview'}
          </button>
          <button type="button" className="text-button" onClick={() => setSearching(s => !s)}>
            Change
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => onChange({ sound: null, soundOff: true })}
          >
            Remove
          </button>
        </div>
      ) : (
        !searching &&
        (finding ? (
          <span className="studio-info">Finding its theme on YouTube…</span>
        ) : (
          <span className="games-sound-row">
            {game.soundOff && <span className="studio-info">No sound.</span>}
            <button type="button" className="text-button" onClick={() => setSearching(true)}>
              Find its theme on YouTube
            </button>
          </span>
        ))
      )}
      {searching && (
        <MusicSearch
          videosOnly
          initialTerm={game.name + ' main theme'}
          placeholder="Search YouTube for a theme or sound…"
          onPick={(url, title) => {
            const source = youtubeSource(url);
            if (source?.kind !== 'video') return;
            onChange({
              sound: { videoId: source.id, start: 0, title: title.slice(0, 200) },
              soundOff: false
            });
            setStart('0:00');
            setSearching(false);
          }}
        />
      )}
    </div>
  );
}

export default function GamesEditor({
  content: c,
  onChange,
  issues = {}
}: {
  content: Content;
  issues?: Record<string, string>;
  onChange: (games: Game[]) => void;
}) {
  const games = c.games;
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<GameResult[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const picked = new Set(games.map(g => g.rawgId));
  const latest = useRef(games);
  useEffect(() => {
    latest.current = games;
  });
  const tried = useRef(new Set<string>());
  const [finding, setFinding] = useState<string[]>([]);
  const [autoError, setAutoError] = useState('');

  // Every game gets its theme automatically: newly added ones, and older ones that never had a sound.
  // Games whose sound was removed (soundOff) are left alone; each game is tried once per visit.
  useEffect(() => {
    const queue = games.filter(g => !g.sound && !g.soundOff && !tried.current.has(g.id));
    if (!queue.length) return;
    queue.forEach(g => tried.current.add(g.id));
    setFinding(f => [...f, ...queue.map(g => g.id)]);
    void (async () => {
      for (const game of queue) {
        try {
          const sound = await findTheme(game.name);
          if (sound)
            onChange(
              latest.current.map(g => (g.id === game.id && !g.sound && !g.soundOff ? { ...g, sound } : g))
            );
        } catch (e) {
          setAutoError(e instanceof Error ? e.message : 'YouTube search failed.');
        }
        setFinding(f => f.filter(id => id !== game.id));
      }
    })();
  }, [games, onChange]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (term.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/games/search?q=' + encodeURIComponent(term.trim()));
      const data = (await response.json()) as { results?: GameResult[]; error?: string };
      if (!response.ok) setError(data.error || 'Search failed.');
      setResults(response.ok ? (data.results ?? []) : null);
    } catch {
      setError('Search failed. Check your connection.');
    }
    setBusy(false);
  }

  const add = (result: GameResult) =>
    onChange([...games, { ...result, id: crypto.randomUUID(), note: '', sound: null, soundOff: false }]);
  const edit = (i: number, note: string) => onChange(games.map((g, j) => (j === i ? { ...g, note } : g)));
  function move(i: number, delta: number) {
    const next = [...games];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    onChange(next);
  }

  return (
    <div className="editor-panel games-panel">
      <div className="skills-toolbar">
        <div className="skills-intro">
          <h3>
            Favourite games <span className="skills-total">{games.length}</span>
          </h3>
          <p className="studio-info">
            Search RAWG and pick up to {MAX_GAMES} games. Cover art, genres, platforms and Metacritic score
            are copied in when you pick, so the site never waits on RAWG. The first game is shown largest.
            Each game&apos;s theme is found on YouTube automatically; change or remove it below.
          </p>
          {finding.length > 0 && (
            <p className="studio-info">Finding themes on YouTube… {finding.length} left</p>
          )}
          {autoError && <p className="studio-status error">{autoError}</p>}
        </div>
      </div>

      <div className="music-search">
        <form onSubmit={search} className="music-search-form">
          <input
            value={term}
            onChange={e => setTerm(e.target.value)}
            placeholder="Search a game, e.g. Elden Ring…"
            aria-label="Search for a game"
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
        {results && !results.length && <p className="studio-info">No games found. Try different words.</p>}
        {!!results?.length && (
          <ul className="music-results">
            {results.map(r => {
              const already = picked.has(r.rawgId);
              return (
                <li key={r.rawgId}>
                  <button
                    type="button"
                    disabled={already || games.length >= MAX_GAMES}
                    onClick={() => add(r)}
                  >
                    {r.image ? (
                      <img src={gameCover(r.image, 420)} alt="" width={96} height={54} loading="lazy" />
                    ) : (
                      <span className="games-editor-blank">
                        <Gamepad2 size={18} />
                      </span>
                    )}
                    <span>
                      <strong>{r.name}</strong>
                      <small>
                        {already ? 'Added · ' : ''}
                        {[year(r.released), r.genres, r.platforms].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!games.length ? (
        <p className="skills-empty">No games yet. The section stays hidden on the site until you add one.</p>
      ) : (
        <div className="ai-editor-list">
          {games.map((g, i) => (
            <div className="ai-editor-row games-editor-row" key={g.id}>
              <span className="games-editor-cover">
                {g.image ? (
                  <img src={gameCover(g.image, 420)} alt="" loading="lazy" />
                ) : (
                  <Gamepad2 size={20} />
                )}
              </span>
              <div className="games-editor-fields">
                <strong>{g.name}</strong>
                <small className="studio-info">
                  {[year(g.released), g.genres, g.metacritic ? 'Metacritic ' + g.metacritic : '']
                    .filter(Boolean)
                    .join(' · ')}
                </small>
                <label className="field">
                  <span>Why you love it (optional)</span>
                  <input
                    id={'field-games.' + i + '.note'}
                    maxLength={160}
                    aria-invalid={!!issues['games.' + i + '.note']}
                    value={g.note}
                    onChange={e => edit(i, e.target.value)}
                  />
                </label>
                {/* Keyed by clip so a newly found or picked theme starts with its own start time. */}
                <GameSoundField
                  key={g.sound?.videoId ?? 'none'}
                  game={g}
                  finding={finding.includes(g.id)}
                  onChange={patch => onChange(games.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                />
              </div>
              <div className="row-controls">
                <button
                  className="icon-button"
                  disabled={i === 0}
                  aria-label={'Move ' + g.name + ' up'}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="icon-button"
                  disabled={i === games.length - 1}
                  aria-label={'Move ' + g.name + ' down'}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={'Remove ' + g.name}
                  onClick={() => onChange(games.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
