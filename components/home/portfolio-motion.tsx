'use client';
import { useRef, type ReactNode } from 'react';
import { usePortfolioMotion } from '@/hooks/use-portfolio-motion';

/** Client island that animates the server-rendered home page sections. */
export default function PortfolioMotion({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  usePortfolioMotion(root, enabled);
  return (
    <div ref={root} className="portfolio-content" data-motion={enabled || undefined}>
      {children}
      {/* Follows the pointer over project covers; positioned by usePortfolioMotion. */}
      <span className="cursor-label" aria-hidden="true">
        View <em>case</em>
      </span>
    </div>
  );
}
