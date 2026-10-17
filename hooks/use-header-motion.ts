'use client';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { scrollMotion } from '@/lib/gsap';
import { useReducedMotion } from './use-reduced-motion';

const finePointer = '(hover: hover) and (pointer: fine)';

// Header entrance, magnetic controls, the Menu/Close label roll, and cursor-led details inside the open menu.
export function useHeaderMotion(
  header: RefObject<HTMLElement | null>,
  menu: RefObject<HTMLDivElement | null>,
  open: boolean
) {
  const reducedMotion = useReducedMotion();
  const firstRender = useRef(true);

  // Drop the bar in once, then let the brand and menu button lean toward the cursor.
  useEffect(() => {
    const root = header.current;
    if (!root || reducedMotion) return;
    const { gsap } = scrollMotion();
    const cleanups: (() => void)[] = [];
    const ctx = gsap.context(() => {
      gsap.from('.header-brand, .header-actions', {
        yPercent: -140,
        autoAlpha: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.15
      });
      // The mark has a CSS hover transition on transform; park it so it doesn't smear the tween.
      gsap.set('.header-mark', { transition: 'none' });
      gsap.from('.header-mark', {
        rotate: -90,
        scale: 0.6,
        duration: 1.4,
        ease: 'back.out(1.8)',
        delay: 0.2,
        clearProps: 'transform,transition'
      });
      if (!window.matchMedia(finePointer).matches) return;
      root.querySelectorAll<HTMLElement>('.header-brand, .menu-button').forEach(el => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
        const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
        // Measure once per hover rather than forcing layout on every pointer event.
        let box = el.getBoundingClientRect();
        const enter = () => {
          box = el.getBoundingClientRect();
        };
        const move = (event: PointerEvent) => {
          xTo((event.clientX - box.left - box.width / 2) * 0.3);
          yTo((event.clientY - box.top - box.height / 2) * 0.4);
        };
        const leave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener('pointerenter', enter);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        cleanups.push(() => {
          el.removeEventListener('pointerenter', enter);
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerleave', leave);
        });
      });
    }, root);
    return () => {
      cleanups.forEach(fn => fn());
      ctx.revert();
    };
  }, [header, reducedMotion]);

  // Roll the button label in from the direction of travel; layout effect so the new word never flashes.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const label = header.current?.querySelector('.menu-label');
    if (!label || reducedMotion) return;
    const { gsap } = scrollMotion();
    gsap.fromTo(
      label,
      { yPercent: open ? 110 : -110, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', overwrite: true }
    );
  }, [header, open, reducedMotion]);

  // While the menu is open: the links drift against the cursor and an accent dot glides to the hovered link.
  useEffect(() => {
    const root = menu.current;
    if (!open || !root || reducedMotion || !window.matchMedia(finePointer).matches) return;
    const { gsap } = scrollMotion();
    const nav = root.querySelector<HTMLElement>('.menu-links');
    const dot = root.querySelector<HTMLElement>('.menu-indicator');
    if (!nav || !dot) return;
    const xTo = gsap.quickTo(nav, 'x', { duration: 1.2, ease: 'power3.out' });
    const yTo = gsap.quickTo(nav, 'y', { duration: 1.2, ease: 'power3.out' });
    gsap.set(dot, { scale: 0, autoAlpha: 0 });

    const onMove = (event: PointerEvent) => {
      xTo((event.clientX / window.innerWidth - 0.5) * -24);
      yTo((event.clientY / window.innerHeight - 0.5) * -18);
    };
    const onOver = (event: PointerEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLElement>('.menu-links a');
      if (!link) return;
      gsap.to(dot, {
        y: link.offsetTop + link.offsetHeight / 2,
        scale: 1,
        autoAlpha: 1,
        duration: 0.6,
        ease: 'expo.out',
        overwrite: 'auto'
      });
    };
    const onLeave = () =>
      gsap.to(dot, { scale: 0, autoAlpha: 0, duration: 0.35, ease: 'power2.in', overwrite: 'auto' });

    root.addEventListener('pointermove', onMove);
    nav.addEventListener('pointerover', onOver);
    nav.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointermove', onMove);
      nav.removeEventListener('pointerover', onOver);
      nav.removeEventListener('pointerleave', onLeave);
      gsap.to(nav, { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
      gsap.set(dot, { scale: 0, autoAlpha: 0 });
    };
  }, [menu, open, reducedMotion]);
}
