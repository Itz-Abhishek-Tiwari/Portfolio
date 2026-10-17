import Link from 'next/link';
import type { SiteInfo } from '@/lib/site';
import OpenMusicButton from '@/components/music/open-music-button';
import PianoWordmark from './piano-wordmark';

export default function SiteFooter({
  site,
  draft,
  onHome
}: {
  site: SiteInfo;
  draft: boolean;
  onHome: boolean;
}) {
  return (
    <footer className="footer">
      {/* The name doubles as a little piano: each letter plays a note on hover. */}
      <PianoWordmark word={site.name.split(' ')[0]} />
      <span>
        © {new Date().getUTCFullYear()} {site.name} ·{' '}
        <span className="footer-hint">
          press <kbd>?</kbd> for shortcuts
        </span>
      </span>
      <nav className="footer-links" aria-label="Footer">
        <Link href="/blog">Journal</Link>
        <a href={site.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={site.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={'mailto:' + site.email}>Email</a>
        {!draft && site.music && <OpenMusicButton>Soundtrack ♪</OpenMusicButton>}
        <a href="/admin">Studio</a>
      </nav>
      {onHome ? <a href="#main">Back to top ↑</a> : <Link href="/">Back home ↑</Link>}
    </footer>
  );
}
