'use client';
import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from './use-reduced-motion';
export function useStudioMotion(root: RefObject<HTMLElement | null>, tab: string, enabled: boolean) {
  useLayoutEffect(() => {
    if (!root.current || !enabled || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.studio-tab-line',
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left', duration: 0.45, ease: 'power2.out' }
      );
      gsap.fromTo('.studio-main-top h1', { y: 7 }, { y: 0, duration: 0.35, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, [root, tab, enabled]);
}
