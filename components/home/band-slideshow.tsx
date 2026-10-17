'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const INTERVAL = 6; // seconds per slide while playing

/**
 * The banner art as a slideshow: advances on its own (paused on hover, focus, off-screen or by the
 * visitor), and by arrows, the progress segments, arrow keys or a swipe. The progress hairline's CSS
 * animation is the timer, so pausing it pauses everything.
 */
export default function BandSlideshow({ images }: { images: string[] }) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState(-1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const media = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const count = images.length;
  const multiple = count > 1;

  const go = useCallback(
    (next: number, dir: 1 | -1) => {
      const target = (next + count) % count;
      if (target === index) return;
      setPrevious(index);
      setDirection(dir);
      setIndex(target);
    },
    [count, index]
  );

  // Only run the clock while the banner is on screen.
  useEffect(() => {
    const el = media.current;
    if (!el || !multiple) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [multiple]);

  if (!count) return null;
  const autoplay = multiple && !reducedMotion;
  const paused = stopped || hovered || focused || !visible;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <div
        ref={media}
        className="band-media"
        onPointerEnter={e => e.pointerType === 'mouse' && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={e => {
          if (multiple) swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={e => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy))
            go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (swipe.current = null)}
      >
        <div className="band-slides" data-dir={direction} data-moved={previous >= 0 || undefined}>
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={i === index ? 'is-active' : i === previous ? 'is-leaving' : undefined}
            />
          ))}
        </div>
      </div>
      {multiple && (
        <div
          className={'band-controls' + (paused ? ' is-paused' : '')}
          role="group"
          aria-roledescription="slideshow"
          aria-label="Banner images"
          style={{ '--band-interval': INTERVAL + 's' } as CSSProperties}
          onPointerEnter={e => e.pointerType === 'mouse' && setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') go(index + 1, 1);
            else if (e.key === 'ArrowLeft') go(index - 1, -1);
          }}
        >
          <span className="band-count" aria-live={autoplay && !stopped ? 'off' : 'polite'}>
            <b>{pad(index + 1)}</b> / {pad(count)}
          </span>
          <div className="band-segments">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                className={i === index ? 'is-current' : i < index ? 'is-done' : undefined}
                aria-label={'Show image ' + (i + 1) + ' of ' + count}
                aria-current={i === index || undefined}
                onClick={() => go(i, i > index ? 1 : -1)}
              >
                {/* Re-keyed per slide so the fill restarts; its end advances the show. */}
                <i
                  key={i === index ? 'run-' + index : 'idle'}
                  onAnimationEnd={e => {
                    if (e.animationName === 'band-progress') go(index + 1, 1);
                  }}
                  data-run={(autoplay && i === index) || undefined}
                />
              </button>
            ))}
          </div>
          <div className="band-arrows">
            <button
              type="button"
              className="round-button band-arrow"
              aria-label="Previous image"
              onClick={() => go(index - 1, -1)}
            >
              <ArrowLeft size={16} />
            </button>
            {autoplay && (
              <button
                type="button"
                className="round-button band-arrow"
                aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'}
                onClick={() => setStopped(s => !s)}
              >
                {stopped ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
            <button
              type="button"
              className="round-button band-arrow"
              aria-label="Next image"
              onClick={() => go(index + 1, 1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
