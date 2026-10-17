'use client';
import { useEffect } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import { scrollMotion } from '@/lib/gsap';
import { onScrollLock } from '@/lib/events';
import { prefersReducedMotion } from './use-reduced-motion';

// Inertial page scroll (Locomotive Scroll v5 on Lenis), kept in step with GSAP ScrollTrigger.
export function useSmoothScroll(enabled: boolean, routeKey: string) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const { gsap, ScrollTrigger } = scrollMotion();
    // One animation loop: Lenis renders on GSAP's ticker, so scroll position and scrubbed
    // tweens update in the same frame instead of two rAF loops drifting a frame apart.
    const scroll = new LocomotiveScroll({
      lenisOptions: { lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true, anchors: false },
      scrollCallback: () => ScrollTrigger.update(),
      initCustomTicker: render => gsap.ticker.add(render),
      destroyCustomTicker: render => gsap.ticker.remove(render)
    });
    // Lag smoothing would hold tweens back after a long frame while the scroll keeps moving.
    gsap.ticker.lagSmoothing(0);
    const header = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || a.target === '_blank' || a.origin !== location.origin || a.pathname !== location.pathname)
        return;
      const id = decodeURIComponent(a.hash.slice(1));
      const target = id ? document.getElementById(id) : document.documentElement;
      if (!target) return;
      e.preventDefault();
      scroll.scrollTo(id ? target : 0, { offset: id ? -(header() + 8) : 0, duration: 1.4 });
      history.pushState(null, '', a.hash || location.pathname);
    };
    const onLoad = () => {
      scroll.resize();
      ScrollTrigger.refresh();
    };
    document.addEventListener('click', onClick);
    const stopLockListener = onScrollLock(locked =>
      locked ? scroll.lenisInstance?.stop() : scroll.lenisInstance?.start()
    );
    window.addEventListener('load', onLoad);
    return () => {
      document.removeEventListener('click', onClick);
      stopLockListener();
      window.removeEventListener('load', onLoad);
      scroll.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [enabled, routeKey]);
}
