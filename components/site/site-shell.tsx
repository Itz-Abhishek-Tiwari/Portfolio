'use client';
import { usePathname } from 'next/navigation';
import { useReaderMotion } from '@/hooks/use-reader-motion';
import { useSmoothScroll } from '@/hooks/use-smooth-scroll';
import type { SiteInfo } from '@/lib/site';
import SiteHeader from './site-header';
import SiteFooter from './site-footer';
import KeyboardShortcuts from './keyboard-shortcuts';
import CustomCursor from './custom-cursor';
import { useVisitorMode } from './visitor-mode';

/** Page frame shared by every public page: theme, header, footer and scroll behaviour. */
export default function SiteShell({
  site,
  children,
  draft = false
}: {
  site: SiteInfo;
  children: React.ReactNode;
  draft?: boolean;
}) {
  const { mode } = useVisitorMode(),
    pathname = usePathname();
  const onHome = pathname === '/' || (draft && pathname === '/admin/preview');
  useReaderMotion(site.motion && !draft);
  useSmoothScroll(!draft, pathname);
  return (
    <div className={'site theme-' + site.theme + ' mode-' + (draft ? site.colorMode : mode)}>
      {!draft && <KeyboardShortcuts />}
      {!draft && <CustomCursor />}
      <SiteHeader site={site} draft={draft} onHome={onHome} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter site={site} draft={draft} onHome={onHome} />
    </div>
  );
}
