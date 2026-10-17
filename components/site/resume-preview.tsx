'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { setScrollLock } from '@/lib/events';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Opens the résumé PDF in a full-screen sheet. It is a plain new-tab link underneath, which is also what
 * phones get, since mobile browsers can't show a PDF inside the page.
 */
export default function ResumePreview({
  src,
  download,
  filename,
  className,
  label,
  children
}: {
  src: string;
  download: string;
  filename: string;
  className: string;
  label?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<'closed' | 'open' | 'closing'>('closed');
  const trigger = useRef<HTMLAnchorElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const open = state !== 'closed';
  // Stored uploads can carry a readable name for the viewer; the fragment hides its thumbnail rail.
  const viewer =
    (src.startsWith('/api/media/') ? src + '?name=' + encodeURIComponent(filename) : src) +
    '#view=FitH&navpanes=0';

  const dismiss = () => setState(prefersReducedMotion() ? 'closed' : 'closing');

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setScrollLock(true);
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setState(prefersReducedMotion() ? 'closed' : 'closing');
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      setScrollLock(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Hand focus back to the button that opened the sheet (not on first mount).
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      trigger.current?.focus({ preventScroll: true });
    }
  }, [open]);

  // Portal into the themed shell: an ancestor transform would trap position: fixed, and body has no theme.
  const host = typeof document === 'undefined' ? null : document.querySelector('.site');

  return (
    <>
      <a
        ref={trigger}
        className={className}
        href={src}
        target="_blank"
        rel="noopener"
        aria-label={label}
        title={label}
        onClick={event => {
          if (window.matchMedia('(max-width: 899px)').matches) return;
          event.preventDefault();
          setState('open');
        }}
      >
        {children}
      </a>
      {open &&
        host &&
        createPortal(
          <div
            className={'resume-sheet' + (state === 'closing' ? ' is-closing' : '')}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-sheet-title"
            onAnimationEnd={event => {
              if (event.target === event.currentTarget && state === 'closing') setState('closed');
            }}
          >
            <div className="resume-bar">
              <div className="resume-bar-title">
                <span className="section-kicker">Preview</span>
                <h2 id="resume-sheet-title">
                  Résumé <em>{filename.replace(/(-?Resume)?\.pdf$/i, '').replace(/-/g, ' ')}</em>
                </h2>
              </div>
              <div className="resume-bar-actions">
                <a className="solid-button" href={download} download={filename}>
                  Download <Download size={16} />
                </a>
                <a className="text-link" href={src} target="_blank" rel="noopener">
                  Open in new tab <ArrowUpRight size={14} />
                </a>
                <button
                  ref={close}
                  type="button"
                  className="round-button resume-close"
                  aria-label="Close preview"
                  onClick={dismiss}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="resume-frame">
              <span className="resume-loading">Loading…</span>
              <iframe src={viewer} title="Résumé preview" />
            </div>
          </div>,
          host
        )}
    </>
  );
}
