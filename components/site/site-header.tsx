'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SiteInfo } from '@/lib/site';
import { setScrollLock } from '@/lib/events';
import { useHeaderMotion } from '@/hooks/use-header-motion';
import { ModeToggle } from './visitor-mode';
import Logo from './logo';
import HeaderMusicButton from '@/components/music/header-music-button';

const sections = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'ai', label: 'AI tools' },
  { id: 'journey', label: 'Experience' }
];

/** Fixed top bar with the full-screen menu. */
export default function SiteHeader({
  site,
  draft,
  onHome
}: {
  site: SiteInfo;
  draft: boolean;
  onHome: boolean;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState('');
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  useHeaderMotion(header, menuPanel, menu);

  // Highlight the section currently in the middle of the viewport.
  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    document.querySelectorAll<HTMLElement>('main section[id]').forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, [onHome]);

  // Read scroll once per frame: tint after leaving the top, slide away while reading downward.
  useEffect(() => {
    let last = window.scrollY,
      frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 6) setHidden(y > last && y > 240);
      last = y;
      header.current?.style.setProperty('--progress', max > 0 ? String(Math.min(1, y / max)) : '0');
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Page height only changes on resize or content changes; reading it every scroll frame forces layout.
    let max = 0;
    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
      onScroll();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(document.body);
    window.addEventListener('resize', measure);
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setScrollLock(true);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      setScrollLock(false);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const sectionHref = (id: string) => (draft && pathname === '/admin/preview' ? '#' + id : '/#' + id);
  const links = [
    ...[...sections, ...(site.games ? [{ id: 'games', label: 'Games' }] : [])].map(item => ({
      key: item.id,
      label: item.label,
      href: sectionHref(item.id),
      current: onHome && active === item.id
    })),
    { key: 'journal', label: 'Journal', href: '/blog', current: !!pathname?.startsWith('/blog') },
    {
      key: 'contact',
      label: 'Contact',
      href: sectionHref('contact'),
      current: onHome && active === 'contact'
    }
  ];

  return (
    <>
      <header
        ref={header}
        className={
          'site-header' + (scrolled && !menu ? ' is-scrolled' : '') + (hidden && !menu ? ' is-hidden' : '')
        }
      >
        <Link
          className="header-brand"
          href={onHome ? '#main' : '/'}
          aria-label={site.name + ' home'}
          onClick={() => setMenu(false)}
        >
          <Logo className="header-mark" />
        </Link>
        <div className="header-actions">
          {!draft && site.music && <HeaderMusicButton />}
          {!draft && <ModeToggle />}
          <button
            type="button"
            className={'menu-button' + (menu ? ' is-open' : '')}
            aria-expanded={menu}
            aria-controls="site-menu"
            onClick={() => setMenu(open => !open)}
          >
            <span className="menu-label">{menu ? 'Close' : 'Menu'}</span>
            <span className="menu-icon" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
        <span className="header-progress" aria-hidden="true" />
      </header>
      <div className={'menu-curtain' + (menu ? ' open' : '')} aria-hidden="true" />
      <div
        ref={menuPanel}
        id="site-menu"
        className={'menu' + (menu ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        inert={!menu}
      >
        <nav className="menu-links" aria-label="All sections">
          <span className="menu-indicator" aria-hidden="true" />
          {links.map((link, index) => (
            <Link
              key={link.key}
              href={link.href}
              className={link.current ? 'active' : ''}
              style={{ ['--i' as string]: index }}
              onClick={() => setMenu(false)}
            >
              <sup>{String(index + 1).padStart(2, '0')}</sup>
              <span className="mask">
                <span>{link.label}</span>
              </span>
            </Link>
          ))}
        </nav>
        <div className="menu-foot" style={{ ['--i' as string]: links.length }}>
          <a href={'mailto:' + site.email}>{site.email}</a>
          <div>
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={site.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
