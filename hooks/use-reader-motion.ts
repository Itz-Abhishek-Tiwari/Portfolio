'use client';
import { useLayoutEffect } from 'react';
import { scrollMotion } from '@/lib/gsap';
import { prefersReducedMotion } from './use-reduced-motion';

// Inner pages: the title settles in and the cover art drifts gently while scrolling.
export function useReaderMotion(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const { gsap } = scrollMotion();
    const ctx = gsap.context(() => {
      const heading = document.querySelector('.detail-heading h1');
      if (heading) gsap.fromTo(heading, { y: 12 }, { y: 0, duration: 0.7, ease: 'power3.out' });
      const art = document.querySelector('.detail-art');
      if (art)
        gsap.fromTo(
          art,
          { y: 10 },
          {
            y: -10,
            ease: 'none',
            scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
          }
        );
    });
    return () => ctx.revert();
  }, [enabled]);
}
