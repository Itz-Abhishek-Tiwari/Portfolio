'use client';
import { useEffect, type RefObject } from 'react';
import { scrollMotion } from '@/lib/gsap';
import { useReducedMotion } from './use-reduced-motion';

// The hero headline rises out of a mask once, sections fade up as they enter, and section kickers pin in the rail.
export function usePortfolioMotion(root: RefObject<HTMLDivElement | null>, enabled = true) {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!root.current || !enabled || reducedMotion) return;
    const { gsap, ScrollTrigger } = scrollMotion();
    const scope = root.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-title .line > span',
        // y: 0 — site.css pre-hides these with translateY(105%), which GSAP would otherwise parse into a lasting pixel offset.
        { y: 0, yPercent: 105 },
        { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, delay: 0.1 }
      );
      gsap.fromTo(
        '.hero-meta, .hero-foot',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.25, delay: 0.5 }
      );
      const targets = scope.querySelectorAll<HTMLElement>(
        '.section-wrap .section-heading, .stat, .service, .journal-row, .project, .experience, .skill-group, .about-figure, .about-main, .repository-directory, .contact-layout, .game-card'
      );
      gsap.set(targets, { y: 28, opacity: 0 });
      ScrollTrigger.batch(targets, {
        start: 'top 92%',
        once: true,
        onEnter: els =>
          // clearProps: a leftover transform would break the fixed-position rail pins below.
          gsap.to(els, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.1,
            overwrite: true,
            clearProps: 'transform'
          })
      });
      // AI toolkit: rows fade in and each name rises out of its mask.
      const aiRows = gsap.utils.toArray<HTMLElement>('.ai-row', scope);
      gsap.set(aiRows, { opacity: 0 });
      gsap.set('.ai-name > span', { yPercent: 110 });
      ScrollTrigger.batch(aiRows, {
        start: 'top 92%',
        once: true,
        onEnter: rows => {
          gsap.to(rows, { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.09 });
          gsap.to(
            rows.map(row => row.querySelector('.ai-name > span')),
            { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.1 }
          );
        }
      });
      // Workbench: the window opens up as it scrolls in while the screenshot settles, then the copy follows.
      const windowFrame = scope.querySelector<HTMLElement>('.workbench-window');
      if (windowFrame) {
        const scrub = { trigger: windowFrame, start: 'top 95%', end: 'top 30%', scrub: 0.6 };
        gsap.fromTo(
          windowFrame,
          { clipPath: 'inset(14% 10% 14% 10% round 24px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 12px)', ease: 'none', scrollTrigger: scrub }
        );
        gsap.fromTo(
          '.workbench-screen img',
          { scale: 1.12 },
          { scale: 1, ease: 'none', scrollTrigger: { ...scrub } }
        );
        gsap.from('.workbench-copy h3, .workbench-copy p, .workbench-rig > div, .workbench-actions', {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: '.workbench-copy', start: 'top 82%', once: true }
        });
      }
      // Hero: the headline drifts up and fades as the page scrolls past it.
      gsap.to('.hero-title', {
        yPercent: -14,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      // Work: each cover opens from a slim band and its image settles. Animates the wrapper's
      // clip-path only, since the cover itself has a CSS transform transition for hover.
      gsap.utils.toArray<HTMLElement>('.project-visual', scope).forEach(visual => {
        gsap.fromTo(
          visual,
          { clipPath: 'inset(12% 8% 12% 8%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: { trigger: visual, start: 'top 95%', end: 'top 45%', scrub: 0.6 }
          }
        );
      });
      // About: the statement lights up word by word as it scrolls through the viewport.
      gsap.fromTo(
        '.about-word',
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: { trigger: '.about-statement', start: 'top 82%', end: 'bottom 48%', scrub: 0.6 }
        }
      );
      // Contact: the closing headline rises out of its mask.
      gsap.fromTo(
        '.contact-title .line > span',
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.3,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.contact-title', start: 'top 88%', once: true }
        }
      );
      // count-up for the stats strip
      scope.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
        const end = Number(el.dataset.count) || 0;
        const counter = { v: 0 };
        el.textContent = '0';
        gsap.to(counter, {
          v: end,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.v));
          }
        });
      });
      // Banner: the frame widens from an inset plate to full bleed as it scrolls in, then the caption rises out of its masks.
      scope.querySelectorAll<HTMLElement>('.band').forEach(band => {
        const media = band.querySelector('.band-media');
        if (media)
          gsap.fromTo(
            media,
            { clipPath: 'inset(9% 6% 9% 6%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: 'none',
              scrollTrigger: { trigger: band, start: 'top bottom', end: 'top 25%', scrub: 0.6 }
            }
          );
        const words = band.querySelectorAll('.band-word');
        const kicker = band.querySelector('.band-kicker');
        const rule = band.querySelector('.band-rule');
        const credit = band.querySelector('.band-credit');
        gsap.set(words, { yPercent: 110, rotate: 4, transformOrigin: '0% 100%' });
        gsap.set([kicker, credit].filter(Boolean), { opacity: 0, y: 12 });
        gsap.set(rule, { scaleX: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: band, start: 'top 55%', once: true } });
        if (kicker) tl.to(kicker, { opacity: 0.8, y: 0, duration: 0.7, ease: 'power3.out' });
        if (rule) tl.to(rule, { scaleX: 1, duration: 0.9, ease: 'expo.out' }, 0.15);
        tl.to(words, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045 }, 0.1);
        if (credit) tl.to(credit, { opacity: 0.72, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.7');
        // Depth: the caption travels a little faster than the art behind it while the banner crosses the screen.
        const caption = band.querySelector('figcaption');
        if (caption)
          gsap.fromTo(
            caption,
            { y: 40 },
            {
              y: -40,
              ease: 'none',
              scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
            }
          );
      });
      // slow drift on the banner images
      scope.querySelectorAll<HTMLElement>('.band-slides').forEach(img => {
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.band'),
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    }, scope);
    // Desktop only: each section's kicker pins in the left rail (like the About portrait) and draws a progress line.
    const mm = gsap.matchMedia(scope);
    mm.add('(min-width: 900px)', () => {
      const offset = () => parseFloat(getComputedStyle(scope).getPropertyValue('--header-h')) + 24;
      scope.querySelectorAll<HTMLElement>('.section-wrap').forEach(section => {
        const kicker = section.querySelector<HTMLElement>(
          '.section-heading .section-kicker, .network-heading .section-kicker'
        );
        if (!kicker) return;
        kicker.classList.add('is-railed');
        ScrollTrigger.create({
          trigger: kicker,
          start: () => 'top ' + offset(),
          endTrigger: section,
          end: () => 'bottom ' + (offset() + kicker.offsetHeight + 48),
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
          onUpdate: self => kicker.style.setProperty('--rail-progress', self.progress.toFixed(3))
        });
      });
      return () => {
        scope.querySelectorAll('.is-railed').forEach(el => el.classList.remove('is-railed'));
      };
    });
    // Fine pointers only: a "View case" label trails the cursor over project covers,
    // and the hero buttons lean gently toward it.
    mm.add('(hover: hover) and (pointer: fine)', () => {
      const cleanups: Array<() => void> = [];
      const on = (el: EventTarget, type: string, fn: EventListener) => {
        el.addEventListener(type, fn, { passive: true });
        cleanups.push(() => el.removeEventListener(type, fn));
      };
      const label = scope.querySelector<HTMLElement>('.cursor-label');
      if (label) {
        gsap.set(label, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
        const toX = gsap.quickTo(label, 'x', { duration: 0.45, ease: 'power3.out' });
        const toY = gsap.quickTo(label, 'y', { duration: 0.45, ease: 'power3.out' });
        let shown = false;
        scope.querySelectorAll<HTMLElement>('.project-card').forEach(card => {
          on(card, 'pointerenter', e => {
            const { clientX, clientY } = e as PointerEvent;
            gsap.set(label, { x: clientX, y: clientY });
            shown = true;
            gsap.to(label, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.5,
              ease: 'back.out(1.5)',
              overwrite: 'auto'
            });
          });
          on(card, 'pointermove', e => {
            toX((e as PointerEvent).clientX);
            toY((e as PointerEvent).clientY);
          });
          on(card, 'pointerleave', () => {
            shown = false;
            gsap.to(label, { scale: 0, autoAlpha: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
          });
        });
        // A fixed label would drift off the cover while the page scrolls under a still pointer.
        // Only tween when it's showing; scroll fires every frame and would stack up tweens.
        on(window, 'scroll', () => {
          if (!shown) return;
          shown = false;
          gsap.to(label, { scale: 0, autoAlpha: 0, duration: 0.2, overwrite: 'auto' });
        });
      }
      // Banner: the art leans gently away from the cursor. Scaled up a touch so the shifted edges never show.
      scope.querySelectorAll<HTMLElement>('.band').forEach(band => {
        const img = band.querySelector<HTMLElement>('.band-slides');
        if (!img) return;
        gsap.set(img, { scale: 1.06 });
        const toX = gsap.quickTo(img, 'x', { duration: 1.2, ease: 'power3.out' });
        const toY = gsap.quickTo(img, 'y', { duration: 1.2, ease: 'power3.out' });
        // The banner is full bleed, so the viewport stands in for its box and nothing is measured per move.
        on(band, 'pointermove', e => {
          const { clientX, clientY } = e as PointerEvent;
          toX((clientX / window.innerWidth - 0.5) * -28);
          toY((clientY / window.innerHeight - 0.5) * -18);
        });
        on(band, 'pointerleave', () => {
          toX(0);
          toY(0);
        });
      });
      scope.querySelectorAll<HTMLElement>('.hero-actions a').forEach(button => {
        // Measure once per hover rather than forcing layout on every pointer event.
        let box = button.getBoundingClientRect();
        on(button, 'pointerenter', () => {
          box = button.getBoundingClientRect();
        });
        const toX = gsap.quickTo(button, 'x', { duration: 0.6, ease: 'power3.out' });
        const toY = gsap.quickTo(button, 'y', { duration: 0.6, ease: 'power3.out' });
        on(button, 'pointermove', e => {
          const { clientX, clientY } = e as PointerEvent;
          toX((clientX - box.left - box.width / 2) * 0.3);
          toY((clientY - box.top - box.height / 2) * 0.3);
        });
        on(button, 'pointerleave', () => {
          toX(0);
          toY(0);
        });
      });
      return () => cleanups.forEach(fn => fn());
    });
    // The display serif swaps in after first paint and shifts every section, so re-measure trigger positions once it lands.
    let live = true;
    document.fonts?.ready.then(() => live && ScrollTrigger.refresh());
    return () => {
      live = false;
      mm.revert();
      ctx.revert();
    };
  }, [root, enabled, reducedMotion]);
}
