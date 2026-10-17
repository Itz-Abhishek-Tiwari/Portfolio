import type { Content } from '@/lib/content';
import { effectiveSkills } from '@/lib/icon-system';

/** A slow, endless strip of the role and stack between the hero and the work. Decorative only. */
export default function Ticker({ content: c }: { content: Content }) {
  const words = [c.role, ...effectiveSkills(c).map(s => s.name)].filter(Boolean);
  if (words.length < 2) return null;
  // The track holds the list twice so translating it by -50% loops without a seam.
  const run = (copy: number) =>
    words.map((word, i) => (
      <span key={copy + '-' + i} className={i % 2 ? 'ticker-word is-italic' : 'ticker-word'}>
        {word}
        <i aria-hidden="true">✦</i>
      </span>
    ));
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track" style={{ '--ticker-items': words.length } as React.CSSProperties}>
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
