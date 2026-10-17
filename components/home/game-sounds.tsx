'use client';
import { useEffect, useRef } from 'react';
import {
  onGameSound,
  playGameSound,
  preloadGameSound,
  stopGameSound,
  toggleGameSound,
  type GameSoundStatus
} from '@/components/music/game-sound';

const LABELS: Record<GameSoundStatus, string> = {
  idle: 'Play theme',
  loading: 'Loading…',
  playing: 'Playing',
  error: 'Can’t play here'
};
const SELECTOR = '[data-sound-video]';
// A short pause before playing, so sweeping the mouse across the grid doesn't fire every theme.
const HOVER_DELAY = 220;

const soundOf = (button: HTMLButtonElement) => ({
  videoId: button.dataset.soundVideo!,
  start: Number(button.dataset.soundStart) || 0,
  title: ''
});
// Browsers only allow sound after the visitor has clicked or pressed a key on the page.
const canAutoplay = () =>
  (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ??
  true;

/**
 * Wires the server-rendered game covers to the theme player. Renders nothing visible.
 * Mouse: hovering a cover plays its theme and leaving fades it out. Touch and keyboard: tap or press to toggle.
 */
export default function GameSounds() {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const section = marker.current?.closest('section');
    if (!section) return;
    const buttons = () => section.querySelectorAll<HTMLButtonElement>(SELECTOR);
    const label = (button: HTMLButtonElement, text: string) => {
      const node = button.querySelector('.game-sound-text');
      if (node) node.textContent = text;
    };
    let pending: ReturnType<typeof setTimeout> | undefined;

    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest<HTMLButtonElement>(SELECTOR);
      if (!button) return;
      clearTimeout(pending);
      void toggleGameSound(button.dataset.soundKey!, soundOf(button));
    };
    const onOver = (e: PointerEvent) => {
      const button = (e.target as Element).closest?.<HTMLButtonElement>(SELECTOR);
      if (!button || button.contains(e.relatedTarget as Node | null)) return;
      preloadGameSound();
      if (e.pointerType !== 'mouse') return;
      clearTimeout(pending);
      if (!canAutoplay()) return label(button, 'Click to play');
      pending = setTimeout(() => void playGameSound(button.dataset.soundKey!, soundOf(button)), HOVER_DELAY);
    };
    const onOut = (e: PointerEvent) => {
      const button = (e.target as Element).closest?.<HTMLButtonElement>(SELECTOR);
      if (!button || button.contains(e.relatedTarget as Node | null) || e.pointerType !== 'mouse') return;
      clearTimeout(pending);
      stopGameSound(button.dataset.soundKey!);
      if (button.dataset.state === 'idle') label(button, LABELS.idle);
    };
    const stop = onGameSound((key, status) =>
      buttons().forEach(button => {
        const state = button.dataset.soundKey === key ? status : 'idle';
        button.dataset.state = state;
        button.setAttribute('aria-pressed', String(state === 'playing' || state === 'loading'));
        label(button, LABELS[state]);
      })
    );
    section.addEventListener('click', onClick);
    section.addEventListener('pointerover', onOver);
    section.addEventListener('pointerout', onOut);
    return () => {
      stop();
      clearTimeout(pending);
      section.removeEventListener('click', onClick);
      section.removeEventListener('pointerover', onOver);
      section.removeEventListener('pointerout', onOut);
    };
  }, []);
  return <span ref={marker} hidden />;
}
