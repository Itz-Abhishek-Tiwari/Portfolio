'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode
} from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';
import { announceModeChange, onModeChange } from '@/lib/events';

type Mode = 'dark' | 'light';
const STORAGE_KEY = 'portfolio-color-mode';
// The site default in force when the visitor chose. When the studio publishes a new default, older
// choices are dropped so the new default reaches everyone, including the admin's own browser.
const DEFAULT_KEY = 'portfolio-color-mode-default';
const DefaultMode = createContext<Mode>('dark');

function storedMode(fallback: Mode): Mode {
  try {
    if (localStorage.getItem(DEFAULT_KEY) !== fallback) return fallback;
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : fallback;
  } catch {
    return fallback;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  const stop = onModeChange(callback);
  return () => {
    window.removeEventListener('storage', callback);
    stop();
  };
}

/** The visitor's light/dark choice, persisted on their device until the site default changes. */
export function useVisitorMode() {
  const fallback = useContext(DefaultMode);
  const mode = useSyncExternalStore(
    subscribe,
    () => storedMode(fallback),
    () => fallback
  );
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode === 'dark' ? 'light' : 'dark');
      localStorage.setItem(DEFAULT_KEY, fallback);
    } catch {}
    announceModeChange();
  }, [mode, fallback]);
  return { mode, toggle };
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export function ModeToggle() {
  const { mode, toggle } = useVisitorMode();
  // The new mode spreads from the button like a ripple on water: a View Transition whose new snapshot is
  // revealed through an expanding circle with ripple rings at its edge (see "Mode ripple" in site.css).
  const ripple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const doc = document as TransitionDocument;
    if (!doc.startViewTransition || prefersReducedMotion()) return toggle();
    const box = e.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2,
      y = box.top + box.height / 2;
    const root = document.documentElement;
    root.style.setProperty('--ripple-x', x + 'px');
    root.style.setProperty('--ripple-y', y + 'px');
    // Far enough that the rings have fully passed the farthest corner.
    root.style.setProperty(
      '--ripple-max',
      Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 140 + 'px'
    );
    root.dataset.modeRipple = '';
    doc.startViewTransition(() => flushSync(toggle)).finished.finally(() => delete root.dataset.modeRipple);
  };
  return (
    <button
      className="mode-toggle"
      onClick={ripple}
      aria-label={'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode'}
    >
      {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export default function VisitorModeProvider({
  defaultMode,
  theme,
  children
}: {
  defaultMode: Mode;
  theme: string;
  children: ReactNode;
}) {
  return (
    <DefaultMode.Provider value={defaultMode}>
      <DocumentMode theme={theme} />
      {children}
    </DefaultMode.Provider>
  );
}

// Keeps the root element's palette and colour scheme in step so the page background, native controls
// and scrollbars match. Re-runs on theme changes because React then rewrites the root's className.
function DocumentMode({ theme }: { theme: string }) {
  const { mode } = useVisitorMode();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.colorMode = mode;
    root.style.colorScheme = mode;
    root.classList.toggle('mode-light', mode === 'light');
    root.classList.toggle('mode-dark', mode === 'dark');
  }, [mode, theme]);
  return null;
}
