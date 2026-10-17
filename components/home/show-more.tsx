'use client';
import { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { scrollMotion } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Expands a server-rendered list whose overflow items carry `.is-extra` (hidden by CSS until the list has
 * `data-expanded`). Only this button hydrates; the list itself stays server-rendered.
 */
export default function ShowMore({ target, hidden, noun }: { target: string; hidden: number; noun: string }) {
  const [open, setOpen] = useState(false);
  function toggle() {
    const list = document.getElementById(target);
    if (!list) return;
    const next = !open;
    setOpen(next);
    list.toggleAttribute('data-expanded', next);
    const { gsap, ScrollTrigger } = scrollMotion();
    // Revealed rows change the page height, so pinned rails and scroll-linked effects must re-measure.
    ScrollTrigger.refresh();
    if (next && !prefersReducedMotion())
      gsap.fromTo(
        list.querySelectorAll('.is-extra'),
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.07,
          clearProps: 'transform,opacity'
        }
      );
    // Collapsing from far below would leave the visitor lost in the next section; bring the list back.
    if (!next && list.getBoundingClientRect().top < 0)
      list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <button
      type="button"
      className={'show-more' + (open ? ' is-open' : '')}
      aria-expanded={open}
      aria-controls={target}
      onClick={toggle}
    >
      <span className="show-more-icon" aria-hidden="true">
        <ArrowDown size={16} />
      </span>
      {open ? (
        <span>
          Show <em>less</em>
        </span>
      ) : (
        <span>
          Show <em>{hidden} more</em> {noun}
        </span>
      )}
    </button>
  );
}
