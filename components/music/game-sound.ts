import { loadYouTubeApi, type Player } from './youtube-api';
import { GAME_CLIP_SECONDS, type GameSound } from '@/lib/games';
import { pauseMusic, resumeMusic } from '@/lib/events';

// Plays a few seconds of a game's theme through one hidden YouTube player shared by every game cover.

export type GameSoundStatus = 'idle' | 'loading' | 'playing' | 'error';
type Listener = (key: string, status: GameSoundStatus) => void;

const FADE_SECONDS = 1.5;
const VOLUME = 80;
const listeners = new Set<Listener>();
let ready: Promise<Player> | null = null;
let current = '';
let status: GameSoundStatus = 'idle';
let fadeTimer: ReturnType<typeof setTimeout> | undefined;
let fadeStep: ReturnType<typeof setInterval> | undefined;
let errorTimer: ReturnType<typeof setTimeout> | undefined;
let loadTimer: ReturnType<typeof setTimeout> | undefined;
// Bumped on every play and stop, so late callbacks from an older clip can tell they are stale.
let clip = 0;
// Where the current clip must end, in video seconds: a hard cap even if a timer is missed.
let clipEnd = 0;

function set(key: string, next: GameSoundStatus) {
  status = next;
  listeners.forEach(l => l(key, next));
}

function clearTimers() {
  clearTimeout(fadeTimer);
  clearInterval(fadeStep);
  clearTimeout(errorTimer);
  clearTimeout(loadTimer);
}

function ensurePlayer() {
  ready ??= loadYouTubeApi()
    .then(
      api =>
        new Promise<Player>((resolve, reject) => {
          const host = document.createElement('div');
          host.className = 'music-engine';
          host.setAttribute('aria-hidden', 'true');
          const node = document.createElement('div');
          host.appendChild(node);
          document.body.appendChild(host);
          const player: Player = new api.Player(node, {
            width: 200,
            height: 200,
            playerVars: { playsinline: 1, controls: 0, origin: location.origin },
            events: {
              onReady: () => resolve(player),
              onStateChange: () => {
                const state = player.getPlayerState();
                // Never let the player run unasked (e.g. it starts after we already gave up or stopped).
                if (state === 1 && status !== 'loading' && status !== 'playing') return player.stopVideo();
                if (state === 1 && status === 'playing' && player.getCurrentTime() > clipEnd) return finish();
                // Playing: start the clock once per clip, then fade out and stop.
                if (state === 1 && status === 'loading') {
                  clearTimeout(loadTimer);
                  set(current, 'playing');
                  fadeTimer = setTimeout(
                    () => fadeOut(FADE_SECONDS),
                    (GAME_CLIP_SECONDS - FADE_SECONDS) * 1000
                  );
                }
                if (state === 0 && status === 'playing') finish();
              },
              onError: () => {
                clearTimers();
                const key = current;
                set(key, 'error');
                errorTimer = setTimeout(() => current === key && set(key, 'idle'), 2600);
              }
            }
          });
          setTimeout(() => reject(new Error('YouTube did not load')), 15000);
        })
    )
    .catch(error => {
      // Let the next click try again instead of keeping a failed load forever.
      ready = null;
      throw error;
    });
  return ready;
}

function fadeOut(duration: number) {
  clearTimeout(fadeTimer);
  clearInterval(fadeStep);
  const mine = clip;
  void ensurePlayer().then(player => {
    if (mine !== clip) return;
    let volume = VOLUME;
    const steps = 10;
    fadeStep = setInterval(
      () => {
        if (mine !== clip) return clearInterval(fadeStep);
        volume -= VOLUME / steps;
        if (volume > 0) return player.setVolume(volume);
        finish();
      },
      (duration * 1000) / steps
    );
  });
}

function finish() {
  clip++;
  clearTimers();
  void ready?.then(player => player.stopVideo());
  set(current, 'idle');
  resumeMusic();
}

/** Warm up the hidden player (e.g. on hover) so the first click starts faster. */
export const preloadGameSound = () => void ensurePlayer().catch(() => {});

function fail(key: string) {
  clip++;
  clearTimers();
  void ready?.then(player => player.stopVideo());
  set(key, 'error');
  errorTimer = setTimeout(() => current === key && set(key, 'idle'), 2600);
  resumeMusic();
}

/** Start a clip (no-op if it is already on). */
export async function playGameSound(key: string, sound: GameSound) {
  if (current === key && (status === 'loading' || status === 'playing')) return;
  if (current && status !== 'idle') finish();
  clearTimers();
  const mine = ++clip;
  clipEnd = sound.start + GAME_CLIP_SECONDS;
  current = key;
  set(key, 'loading');
  pauseMusic();
  // A browser that blocks the sound leaves YouTube waiting forever; give up after a while.
  loadTimer = setTimeout(() => mine === clip && status === 'loading' && fail(key), 8000);
  try {
    const player = await ensurePlayer();
    if (mine !== clip) return;
    player.setVolume(VOLUME);
    player.loadVideoById({
      videoId: sound.videoId,
      startSeconds: sound.start,
      endSeconds: sound.start + GAME_CLIP_SECONDS + 1
    });
  } catch {
    fail(key);
  }
}

/** Fade a clip out quickly, e.g. when the pointer leaves its cover. */
export function stopGameSound(key: string) {
  if (current !== key) return;
  if (status === 'loading') return finish();
  if (status === 'playing') fadeOut(0.35);
}

/** Play a clip, or stop it if this one is already playing. */
export function toggleGameSound(key: string, sound: GameSound) {
  if (current === key && (status === 'loading' || status === 'playing')) return finish();
  return playGameSound(key, sound);
}

export function onGameSound(listener: Listener) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
