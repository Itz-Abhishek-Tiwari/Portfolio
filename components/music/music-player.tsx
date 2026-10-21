'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowUpRight, Music2 } from 'lucide-react';
import { youtubeSource, musicSourceUrl } from '@/lib/music';
import { scrollMotion } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';
import { announceMusic, onPauseMusic, onResumeMusic } from '@/lib/events';
import { loadYouTubeApi, type Player } from './youtube-api';
const clock = (n: number) => Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0');
export default function MusicPlayer({
  url,
  title,
  minimized = false
}: {
  url: string;
  title: string;
  minimized?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    player = useRef<Player | null>(null),
    slot = useRef<HTMLSpanElement>(null),
    disc = useRef<HTMLSpanElement>(null),
    spin = useRef<gsap.core.Tween | null>(null),
    resumeAfterClip = useRef(false);
  const [ready, setReady] = useState(false),
    [playing, setPlaying] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(65),
    [track, setTrack] = useState<{ title?: string; author?: string; video_id?: string }>({}),
    [error, setError] = useState(''),
    [noHiRes, setNoHiRes] = useState(''),
    [position, setPosition] = useState({ index: 0, total: 0 });
  useEffect(() => {
    let alive = true;
    let triedAlternative = false;
    // Consecutive tracks skipped because they can't play here; capped so an all-blocked playlist can't loop forever.
    let skipped = 0;
    const maxSkips = 15;
    const blockedMessage =
      'The owner of this song does not allow it to play on other sites. Use "Open on YouTube" to listen.';
    const wrapper = host.current;
    const node = document.createElement('div');
    wrapper?.appendChild(node);
    loadYouTubeApi()
      .then(api => {
        if (!alive) return;
        const source = youtubeSource(url);
        player.current = new api.Player(node, {
          width: 200,
          height: 200,
          ...(source?.kind === 'video' ? { videoId: source.id } : {}),
          playerVars: {
            ...(source?.kind === 'video'
              ? { loop: 1, playlist: source.id }
              : { listType: 'playlist', list: source?.id }),
            playsinline: 1,
            origin: location.origin,
            autoplay: 0
          },
          events: {
            onReady: () => {
              if (alive) {
                player.current?.setVolume(65);
                setReady(true);
              }
            },
            onStateChange: () => {
              const p = player.current;
              if (!alive || !p) return;
              if (p.getPlayerState() === 1) skipped = 0;
              setPlaying(p.getPlayerState() === 1);
              setTrack(p.getVideoData() || {});
              // Tell the header's now-playing button.
              announceMusic({ playing: p.getPlayerState() === 1, title: p.getVideoData()?.title || '' });
              setPosition({ index: p.getPlaylistIndex?.() ?? 0, total: p.getPlaylist?.()?.length ?? 0 });
              setDuration(p.getDuration() || 0);
              setElapsed(p.getCurrentTime() || 0);
            },
            onError: (event: { data?: number }) => {
              if (!alive) return;
              const blocked = [100, 101, 150, 153].includes(event.data ?? 0);
              if (blocked && source?.kind === 'video' && !triedAlternative) {
                triedAlternative = true;
                setError('Finding a version of this song that can play here…');
                fetch('/api/music/alternative?v=' + source.id)
                  .then(r => r.json() as Promise<{ id?: string | null }>)
                  .then(data => {
                    if (!alive) return;
                    if (data.id) {
                      setError('');
                      player.current?.loadVideoById(data.id);
                    } else setError(blockedMessage);
                  })
                  .catch(() => alive && setError(blockedMessage));
                return;
              }
              // In a playlist, quietly move past any track that refuses to play here.
              if (source?.kind === 'playlist' && skipped < maxSkips) {
                skipped++;
                setError('');
                player.current?.nextVideo();
                return;
              }
              setPlaying(false);
              setError(
                source?.kind === 'playlist'
                  ? 'The next few songs in this playlist can’t play on other sites. Use "Open on YouTube" to listen.'
                  : blocked
                    ? blockedMessage
                    : 'This track cannot play here. Open it on YouTube to listen.'
              );
            },
            onAutoplayBlocked: () => {
              if (alive) setError('Playback was blocked. Open the playlist on YouTube.');
            }
          }
        });
      })
      .catch(e => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
      announceMusic({ playing: false, title: '' });
      player.current?.destroy();
      player.current = null;
      node.remove();
    };
  }, [url]);
  // A game theme clip pauses the soundtrack; it picks up again when the clip ends, unless the
  // visitor took over the controls in between. The short wait covers hovering from one cover to the
  // next, where one clip ends just before the next one starts.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopPause = onPauseMusic(() => {
      clearTimeout(timer);
      if (player.current?.getPlayerState() === 1) resumeAfterClip.current = true;
      player.current?.pauseVideo();
    });
    const stopResume = onResumeMusic(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!resumeAfterClip.current) return;
        resumeAfterClip.current = false;
        player.current?.playVideo();
      }, 600);
    });
    return () => {
      clearTimeout(timer);
      stopPause();
      stopResume();
    };
  }, []);
  // Track progress only while something is playing; state changes cover the rest.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setElapsed(player.current?.getCurrentTime() || 0), 500);
    return () => clearInterval(timer);
  }, [playing]);
  // The record spins up and slides out from behind the sleeve while playing, and winds down when paused.
  useEffect(() => {
    if (!disc.current || prefersReducedMotion()) return;
    const { gsap } = scrollMotion();
    spin.current = gsap.to(disc.current, {
      rotation: 360,
      duration: 3.2,
      ease: 'none',
      repeat: -1,
      paused: true
    });
    return () => {
      spin.current?.kill();
      spin.current = null;
    };
  }, []);
  useEffect(() => {
    const tween = spin.current;
    if (!tween || !slot.current) return;
    const { gsap } = scrollMotion();
    if (playing) {
      tween.play();
      gsap.fromTo(
        tween,
        { timeScale: 0 },
        { timeScale: 1, duration: 1.2, ease: 'power2.out', overwrite: true }
      );
    } else
      gsap.to(tween, {
        timeScale: 0,
        duration: 1,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => tween.pause()
      });
    gsap.to(slot.current, {
      x: minimized ? 0 : playing ? '40%' : '18%',
      duration: 0.9,
      ease: 'expo.out',
      overwrite: true
    });
  }, [playing, minimized]);
  const progress = duration ? Math.min(elapsed / duration, 1) : 0;
  // 16:9 thumbnails carry no letterbox bars, so a centre crop to the square sleeve leaves just the artwork.
  // maxresdefault isn't generated for every video; fall back to the always-present mqdefault when it 404s.
  const thumb = (size: string) => 'https://i.ytimg.com/vi/' + track.video_id + '/' + size + '.jpg';
  const art = track.video_id ? thumb('mqdefault') : '';
  const cover = track.video_id && noHiRes !== track.video_id ? thumb('maxresdefault') : art;
  function control(action: () => void) {
    setError('');
    resumeAfterClip.current = false;
    action();
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className={'custom-music-player now-playing' + (error ? ' has-alert' : '')}>
      <div ref={host} className="music-engine" aria-hidden="true" />
      <div className="np-track">
        <div className="music-stage">
          <span ref={slot} className="music-disc-slot" aria-hidden="true">
            <span ref={disc} className="music-disc">
              <span
                className="music-disc-label"
                style={art ? { backgroundImage: 'url(' + art + ')' } : undefined}
              />
            </span>
          </span>
          <span className="music-cover">
            {art ? (
              <img src={cover} alt="" onError={() => setNoHiRes(track.video_id || '')} />
            ) : (
              <span className="music-art-placeholder">
                <Music2 size={24} />
              </span>
            )}
          </span>
        </div>
        <div className="np-meta">
          <p className="np-status" aria-live="polite">
            <span className={'music-visualizer' + (playing ? ' is-playing' : '')} aria-hidden="true">
              <span className="eq-bar eq-bar-1" />
              <span className="eq-bar eq-bar-2" />
              <span className="eq-bar eq-bar-3" />
              <span className="eq-bar eq-bar-4" />
            </span>
            {playing ? 'Playing' : ready ? 'Paused' : 'Loading'}
            {position.total > 1 && (
              <span className="np-count">
                {pad(position.index + 1)} / {pad(position.total)}
              </span>
            )}
          </p>
          <h4>{track.title || 'Press play to start'}</h4>
          <p className="np-artist">{track.author || title}</p>
        </div>
      </div>
      <div className="np-progress">
        <span>{clock(elapsed)}</span>
        <div className="music-range" style={{ '--value': progress } as CSSProperties}>
          <input
            aria-label="Seek track"
            type="range"
            min="0"
            max={duration || 1}
            step="1"
            value={Math.min(elapsed, duration || 1)}
            disabled={!ready || !duration}
            onChange={e => {
              const time = Number(e.target.value);
              player.current?.seekTo(time, true);
              setElapsed(time);
            }}
          />
        </div>
        <span>{clock(duration)}</span>
      </div>
      <div className="np-controls">
        <div className="music-controls">
          <button
            aria-label="Previous track"
            disabled={!ready}
            onClick={() => control(() => player.current?.previousVideo())}
          >
            <SkipBack size={17} />
          </button>
          <button
            className="music-play"
            aria-label={playing ? 'Pause music' : 'Play music'}
            disabled={!ready}
            onClick={() =>
              control(() => (playing ? player.current?.pauseVideo() : player.current?.playVideo()))
            }
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            aria-label="Next track"
            disabled={!ready}
            onClick={() => control(() => player.current?.nextVideo())}
          >
            <SkipForward size={17} />
          </button>
        </div>
        <label className="music-volume">
          <Volume2 size={15} />
          <span className="music-range" style={{ '--value': volume / 100 } as CSSProperties}>
            <input
              aria-label="Music volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={e => {
                const next = Number(e.target.value);
                setVolume(next);
                player.current?.setVolume(next);
              }}
            />
          </span>
        </label>
      </div>
      {error && (
        <p role="status" className="music-error">
          {error}
        </p>
      )}
      <a className="music-source" href={musicSourceUrl(url)} target="_blank" rel="noreferrer">
        Open on YouTube <ArrowUpRight size={13} />
      </a>
    </div>
  );
}
