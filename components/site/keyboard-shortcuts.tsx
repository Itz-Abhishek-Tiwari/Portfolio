'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';
import { useVisitorMode } from './visitor-mode';

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a'
];

function confetti() {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '500',
    pointerEvents: 'none'
  });
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  const styles = getComputedStyle(document.querySelector('.site') || document.body);
  const colors = ['--accent', '--accent-2', '--text', '--success']
    .map(name => styles.getPropertyValue(name).trim())
    .filter(Boolean);
  const pieces = Array.from({ length: 140 }, () => ({
    x: canvas.width / 2,
    y: canvas.height * 0.62,
    vx: (Math.random() - 0.5) * 22 * ratio,
    vy: (-Math.random() * 20 - 6) * ratio,
    size: (5 + Math.random() * 7) * ratio,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)] || '#fff'
  }));
  const start = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.vy += 0.55 * ratio;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - t / 3200);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t < 3200) raf = requestAnimationFrame(frame);
    else canvas.remove();
  };
  raf = requestAnimationFrame(frame);
  window.setTimeout(() => {
    cancelAnimationFrame(raf);
    canvas.remove();
  }, 3600);
}

// Keyboard shortcuts (press ?) and a hidden Konami-code surprise.
export default function KeyboardShortcuts() {
  const router = useRouter();
  const { toggle } = useVisitorMode();
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');
  const progress = useRef(0);

  useEffect(() => {
    let timer = 0;
    const say = (text: string) => {
      setToast(text);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(''), 2600);
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const expected = KONAMI[progress.current];
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === expected) {
        progress.current += 1;
        if (progress.current === KONAMI.length) {
          progress.current = 0;
          confetti();
          say('You found it. Nice.');
        }
      } else progress.current = key === KONAMI[0] ? 1 : 0;

      if (event.key === '?') {
        setHelp(open => !open);
        return;
      }
      if (event.key === 'Escape') {
        setHelp(false);
        return;
      }
      const k = event.key.toLowerCase();
      if (k === 't') {
        toggle();
        say('Theme toggled');
      } else if (k === 'm') document.querySelector<HTMLButtonElement>('.menu-button')?.click();
      else if (k === 'j') router.push('/blog');
      else if (k === 'h') router.push('/');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [router, toggle]);

  return (
    <>
      {help && (
        <div className="shortcuts" role="dialog" aria-label="Keyboard shortcuts">
          <div className="shortcuts-top">
            <span>Keyboard shortcuts</span>
            <button type="button" aria-label="Close shortcuts" onClick={() => setHelp(false)}>
              Esc
            </button>
          </div>
          <dl>
            <div>
              <dt>T</dt>
              <dd>Toggle light / dark</dd>
            </div>
            <div>
              <dt>M</dt>
              <dd>Open the menu</dd>
            </div>
            <div>
              <dt>J</dt>
              <dd>Go to the journal</dd>
            </div>
            <div>
              <dt>H</dt>
              <dd>Back home</dd>
            </div>
            <div>
              <dt>?</dt>
              <dd>This panel</dd>
            </div>
          </dl>
          <p>There is one more, if you know the old code.</p>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
