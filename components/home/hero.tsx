import { ArrowDown, Download, ExternalLink, Eye } from 'lucide-react';
import { resumeLink, type Content } from '@/lib/content';
import LiveClock from '@/components/site/live-clock';
import ResumePreview from '@/components/site/resume-preview';

export default function Hero({ content: c }: { content: Content }) {
  const headline = c.headline.split('\n').filter(Boolean);
  const resume = resumeLink(c);
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
          <span>{headline[0] || 'Code with craft.'}</span>
        </span>
        <span className="line">
          <span>
            <em>{headline[1] || 'Build with soul.'}</em>
          </span>
        </span>
      </h1>

      <div className="hero-foot">
        <p className="hero-intro">{c.intro}</p>
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
          <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="outline-button">
            Connect on LinkedIn <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
