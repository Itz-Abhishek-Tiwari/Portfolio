'use client';
import { useEffect, useRef } from 'react';
import { scrollMotion } from '@/lib/gsap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const INTERACTIVE = 'a, button, [role="button"], label, select, summary, input[type="range"]';
// Typing fields bring back the native text cursor; project covers show their own "View case" label instead.
const NATIVE = 'input:not([type="range"]), textarea, [contenteditable="true"]';
const HANDOFF = '.project-card';

/** A dot that follows the pointer and a ring that trails it, growing over anything clickable. Fine pointers only. */
export default function CustomCursor() {
  const dot = useRef<HTMLSpanElement>(null),
    ring = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion || !dot.current || !ring.current) return;
    const { gsap } = scrollMotion();
    const mm = gsap.matchMedia();
    mm.add('(hover: hover) and (pointer: fine)', () => {
      const d = dot.current!,
        r = ring.current!;
      const root = document.documentElement;
      root.classList.add('has-cursor');
      gsap.set([d, r], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
      const dotX = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3.out' }),
        dotY = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3.out' }),
        ringX = gsap.quickTo(r, 'x', { duration: 0.45, ease: 'power3.out' }),
        ringY = gsap.quickTo(r, 'y', { duration: 0.45, ease: 'power3.out' });
      let mode = '';
      const setMode = (next: 'idle' | 'hover' | 'hidden') => {
        if (next === mode) return;
        mode = next;
        r.classList.toggle('is-hover', next === 'hover');
        gsap.to(d, { autoAlpha: next === 'idle' ? 1 : 0, scale: next === 'idle' ? 1 : 0.4, duration: 0.25 });
        gsap.to(r, {
          autoAlpha: next === 'hidden' ? 0 : 1,
          scale: next === 'hover' ? 1.9 : 1,
          duration: 0.45,
          ease: 'expo.out'
        });
      };
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        if (!mode) {
          // First move: start both at the pointer instead of sliding in from the corner.
          gsap.set([d, r], { x: e.clientX, y: e.clientY });
        }
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
        if (!mode) over(e);
      };
      // Hover state only changes when the element under the pointer does, so resolve it on
      // pointerover instead of running three selector walks on every move.
      const over = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const target = e.target as Element | null;
        setMode(
          target?.closest(NATIVE) || target?.closest(HANDOFF)
            ? 'hidden'
            : target?.closest(INTERACTIVE)
              ? 'hover'
              : 'idle'
        );
      };
      const press = () =>
        gsap.to(r, { scale: mode === 'hover' ? 1.6 : 0.8, duration: 0.2, ease: 'power3.out' });
      const release = () =>
        gsap.to(r, { scale: mode === 'hover' ? 1.9 : 1, duration: 0.5, ease: 'back.out(1.5)' });
      const leave = () => setMode('hidden');
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerover', over, { passive: true });
      window.addEventListener('pointerdown', press);
      window.addEventListener('pointerup', release);
      root.addEventListener('mouseleave', leave);
      return () => {
        root.classList.remove('has-cursor');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerover', over);
        window.removeEventListener('pointerdown', press);
        window.removeEventListener('pointerup', release);
        root.removeEventListener('mouseleave', leave);
      };
    });
    return () => mm.revert();
  }, [reducedMotion]);
  return (
    <>
      <span ref={ring} className="cursor-ring" aria-hidden="true" />
      <span ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
