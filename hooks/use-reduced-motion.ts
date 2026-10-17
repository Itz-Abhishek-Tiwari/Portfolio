'use client';
import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

/** One-off check for effects that run once. */
export const prefersReducedMotion = () => window.matchMedia(query).matches;

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

/** Live value; reports reduced motion during SSR so nothing animates before hydration. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => true);
}
