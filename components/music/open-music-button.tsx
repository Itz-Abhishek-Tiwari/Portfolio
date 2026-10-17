'use client';
import type { ReactNode } from 'react';
import { openMusic } from '@/lib/events';

/** Opens the listening corner from anywhere on the page. */
export default function OpenMusicButton({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={openMusic}>
      {children}
    </button>
  );
}
