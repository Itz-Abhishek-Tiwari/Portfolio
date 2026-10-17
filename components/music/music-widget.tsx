'use client';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import type { Content } from '@/lib/content';
import { musicEmbedUrl, spotifySource } from '@/lib/music';
import { announceMusic, onOpenMusic, onToggleMusic } from '@/lib/events';
import { scrollMotion } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';
import { useVisitorMode } from '@/components/site/visitor-mode';

// The player and the YouTube API only load once a visitor opens the listening corner from the header.
const MusicPlayer = lazy(() => import('./music-player'));

/**
 * Geometry for the drop: the header button's centre (where it leaves and returns) and the point on the
 * panel's top edge where it lands, both in viewport pixels, plus that point as the panel's scale origin.
 */
function dropPath(panel: HTMLElement) {
  const box = panel.getBoundingClientRect();
  const button = document.querySelector('[data-music-toggle]')?.getBoundingClientRect();
  const fromX = button ? button.left + button.width / 2 : box.right - 40;
  const fromY = button ? button.top + button.height / 2 : box.top - 30;
  const landX = Math.min(Math.max(fromX, box.left + 24), box.right - 24);
  return { fromX, fromY, landX, landY: box.top, origin: landX - box.left + 'px 0px' };
}

/** A ripple on the header button, where the drop lands or leaves. */
function ripple() {
  const button = document.querySelector<HTMLElement>('[data-music-toggle]');
  if (!button) return;
  // A data attribute, not a class: React rewrites the button's className when its state changes.
  delete button.dataset.ripple;
  void button.offsetWidth; // restart the CSS animation
  button.dataset.ripple = String(Date.now());
}

/**
 * The listening corner falls out of the header's now-playing button like a drop of water and is drawn
 * back into it when hidden. Hiding keeps the music playing; the header shows what's on.
 */
export default function MusicWidget({ music, theme }: { music: Content['music']; theme: Content['theme'] }) {
  const { mode } = useVisitorMode();
  const [loaded, setLoaded] = useState(false),
    [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const admin = usePathname()?.startsWith('/admin');
  const embed = musicEmbedUrl(music.playlistUrl);
  const spotify = spotifySource(music.playlistUrl);

  const drop = useRef<HTMLSpanElement>(null);
  const hiding = useRef(false);
  // Hidden: the panel shrinks into a drop on its top edge, the drop rises back into the header button,
  // and the button ripples. Only transform and opacity animate, so it stays on the GPU and smooth.
  const hide = () => {
    const el = panel.current,
      bead = drop.current;
    if (!el || !bead || hiding.current) return;
    if (prefersReducedMotion()) return setShown(false);
    hiding.current = true;
    const { gsap } = scrollMotion();
    const path = dropPath(el);
    gsap.set(el, { transformOrigin: path.origin });
    gsap.set(bead, { x: path.landX, y: path.landY, scale: 0, autoAlpha: 1 });
    gsap
      .timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          hiding.current = false;
          setShown(false);
          ripple();
          gsap.set(el, { clearProps: 'transform,transformOrigin,opacity,visibility' });
        }
      })
      .to(el, { scale: 0.12, autoAlpha: 0, duration: 0.34, ease: 'power3.in' })
      .to(bead, { scale: 1, duration: 0.14, ease: 'power2.out' }, 0.2)
      .to(bead, {
        x: path.fromX,
        y: path.fromY,
        scaleX: 0.8,
        scaleY: 1.35,
        duration: 0.26,
        ease: 'power2.in'
      })
      .to(bead, { scale: 0, autoAlpha: 0, duration: 0.12, ease: 'power1.in' });
  };
  const hideRef = useRef(hide);
  useEffect(() => {
    hideRef.current = hide;
  });

  useEffect(() => announceMusic({ loaded, shown }), [loaded, shown]);
  useEffect(() => {
    const show = () => {
      setLoaded(true);
      setShown(true);
    };
    const stopOpen = onOpenMusic(show);
    const stopToggle = onToggleMusic(() =>
      panel.current?.dataset.shown === 'true' ? hideRef.current() : show()
    );
    return () => {
      stopOpen();
      stopToggle();
    };
  }, []);
  // Shown: a drop falls from the header button, lands on the panel's top edge, and the panel springs open from it.
  useLayoutEffect(() => {
    const el = panel.current,
      bead = drop.current;
    if (!shown || !el || !bead || prefersReducedMotion()) return;
    const { gsap } = scrollMotion();
    const path = dropPath(el);
    ripple();
    gsap.set(el, { transformOrigin: path.origin, scale: 0.12, autoAlpha: 0 });
    gsap.set(bead, { x: path.fromX, y: path.fromY, scale: 0, autoAlpha: 1 });
    gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .to(bead, { scale: 1, duration: 0.12, ease: 'power2.out' })
      .to(bead, {
        y: path.landY,
        x: path.landX,
        scaleX: 0.8,
        scaleY: 1.35,
        duration: 0.24,
        ease: 'power2.in'
      })
      .to(bead, { scaleX: 1.5, scaleY: 0.6, autoAlpha: 0, duration: 0.18, ease: 'power2.out' })
      .to(
        el,
        { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out', clearProps: 'transform,transformOrigin' },
        '<'
      );
  }, [shown]);
  // Like a dropdown: Escape or a click elsewhere hides it. The header button toggles on its own.
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hideRef.current();
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!panel.current?.contains(target) && !target?.closest('[data-music-toggle]')) hideRef.current();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [shown]);
  if (admin || !embed || !loaded) return null;
  return (
    <aside className={'music-widget theme-' + theme + ' mode-' + mode} aria-label="Listening corner">
      {/* On <body>, above the header: the player's own layer sits below it, and the drop must reach the button. */}
      {createPortal(<span ref={drop} className="music-drop" aria-hidden="true" />, document.body)}
      {/* Hidden rather than unmounted, so the music keeps playing. */}
      <div
        ref={panel}
        className={'music-panel' + (shown ? '' : ' is-hidden')}
        data-shown={shown}
        data-lenis-prevent
        inert={!shown}
      >
        <div className="music-panel-header">
          <span className="section-kicker">
            Now playing <em>· {music.title}</em>
          </span>
          <div className="music-window-actions">
            <button aria-label="Hide music player (keeps playing)" onClick={hide}>
              <Minus size={18} />
            </button>
          </div>
        </div>
        {spotify ? (
          <div className="spotify-wrap">
            <iframe
              className="spotify-embed"
              title={music.title}
              src={embed}
              width="100%"
              height={spotify.type === 'track' ? 152 : 352}
              allow="encrypted-media; clipboard-write"
              loading="lazy"
            />
          </div>
        ) : (
          <Suspense fallback={null}>
            <MusicPlayer url={music.playlistUrl} title={music.title} />
          </Suspense>
        )}
      </div>
    </aside>
  );
}
