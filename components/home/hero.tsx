import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Download, ExternalLink, Eye } from 'lucide-react';
import { resumeLink, type Content } from '@/lib/content';
import LiveClock from '@/components/site/live-clock';
import ResumePreview from '@/components/site/resume-preview';

// Each word is its own box, so the headline can rise word by word inside each line's mask.
function Words({ text, italic = false }: { text: string; italic?: boolean }) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => (
      <span key={i}>
        {i > 0 && ' '}
        <span className="word">{italic ? <em>{word}</em> : word}</span>
      </span>
    ));
}

export default function Hero({ content: c }: { content: Content }) {
  const headline = c.headline.split('\n').filter(Boolean);
  const resume = resumeLink(c);
  // Like About's "Building" fact: the first featured project, so it follows the studio content.
  const building = c.projects.find(p => p.featured);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-meta">
        <span className="hero-id">
          {c.portrait && (
            <span className="hero-avatar" tabIndex={0} title="Hover to meet the anime me">
              <img className="face-real" src={c.portrait} alt="" fetchPriority="high" />
              {c.portraitIllustrated && (
                <img className="face-anime" src={c.portraitIllustrated} alt="" loading="lazy" />
              )}
            </span>
          )}
          {c.name}
        </span>
        <span>{c.role}</span>
        <LiveClock />
        <span>
          <i />
          Open to opportunities
        </span>
      </div>

      <h1 id="hero-title" className="hero-title">
        <span className="line">
          <Words text={headline[0] || 'Code with craft.'} />
        </span>
        <span className="line">
          <Words text={headline[1] || 'Build with soul.'} italic />
        </span>
      </h1>

      <div className="hero-foot">
        <p className="hero-intro">{c.intro}</p>
        {building && (
          // A client-side link, so the soundtrack keeps playing.
          <Link className="hero-now" href={'/projects/' + (building.slug || building.id)}>
            <span className="section-kicker">Building</span>
            <span className="hero-now-title">
              {building.title} <ArrowUpRight size={18} />
            </span>
          </Link>
        )}
        <div className="hero-actions">
          <a href="#work" className="solid-button">
            View work <ArrowDown size={16} />
          </a>
          <span className="resume-pair">
            <a href={resume.href} download={resume.filename} className="outline-button">
              Résumé <Download size={16} />
            </a>
            <ResumePreview
              src={c.resume}
              download={resume.href}
              filename={resume.filename}
              className="outline-button is-round"
              label="Preview résumé"
            >
              <Eye size={17} />
            </ResumePreview>
          </span>
          <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="text-link hero-linkedin">
            LinkedIn <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
