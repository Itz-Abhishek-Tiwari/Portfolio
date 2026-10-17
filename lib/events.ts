// Window events that let independent client islands talk without shared state.
const OPEN_MUSIC = 'portfolio:open-music';
const MODE_CHANGE = 'portfolio:mode';
const SCROLL_LOCK = 'portfolio:scroll-lock';

export const openMusic = () => window.dispatchEvent(new Event(OPEN_MUSIC));
export const onOpenMusic = (listener: () => void) => listen(OPEN_MUSIC, listener);

export const announceModeChange = () => window.dispatchEvent(new Event(MODE_CHANGE));
export const onModeChange = (listener: () => void) => listen(MODE_CHANGE, listener);

export const setScrollLock = (locked: boolean) =>
  window.dispatchEvent(new CustomEvent<boolean>(SCROLL_LOCK, { detail: locked }));
export const onScrollLock = (listener: (locked: boolean) => void) =>
  listen(SCROLL_LOCK, event => listener((event as CustomEvent<boolean>).detail));

// Now-playing state, shared by the music widget (writer) and the header button (reader).
export type MusicState = { loaded: boolean; shown: boolean; playing: boolean; title: string };
const MUSIC_STATE = 'portfolio:music-state';
const TOGGLE_MUSIC = 'portfolio:toggle-music';
const idleMusic: MusicState = { loaded: false, shown: false, playing: false, title: '' };
let musicState = idleMusic;

export const musicSnapshot = () => musicState;
export const idleMusicSnapshot = () => idleMusic;
export function announceMusic(change: Partial<MusicState>) {
  const next = { ...musicState, ...change };
  if (Object.keys(next).every(k => next[k as keyof MusicState] === musicState[k as keyof MusicState])) return;
  musicState = next;
  window.dispatchEvent(new Event(MUSIC_STATE));
}
export const onMusicState = (listener: () => void) => listen(MUSIC_STATE, listener);

/** Show the player if hidden (loading it the first time), hide it if shown. */
export const toggleMusic = () => window.dispatchEvent(new Event(TOGGLE_MUSIC));
export const onToggleMusic = (listener: () => void) => listen(TOGGLE_MUSIC, listener);

// A game theme is about to play: the soundtrack pauses so the two don't overlap.
const PAUSE_MUSIC = 'portfolio:pause-music';
export const pauseMusic = () => window.dispatchEvent(new Event(PAUSE_MUSIC));
export const onPauseMusic = (listener: () => void) => listen(PAUSE_MUSIC, listener);

function listen(name: string, listener: (event: Event) => void) {
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
