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
const DefaultMode = createContext<Mode>('dark');

function storedMode(fallback: Mode): Mode {
  try {
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

/** The visitor's light/dark choice, persisted on their device; falls back to the site default. */
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
    } catch {}
    announceModeChange();
  }, [mode]);
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
  children
}: {
  defaultMode: Mode;
  children: ReactNode;
}) {
  return (
    <DefaultMode.Provider value={defaultMode}>
      <DocumentMode />
      {children}
    </DefaultMode.Provider>
  );
}

// Keeps the root element's colour scheme in step so native controls and scrollbars match.
function DocumentMode() {
  const { mode } = useVisitorMode();
  useEffect(() => {
    document.documentElement.dataset.colorMode = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);
  return null;
}
