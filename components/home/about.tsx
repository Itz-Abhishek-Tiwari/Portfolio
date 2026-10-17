import { Fragment } from 'react';
import { ArrowUpRight, Download, Eye } from 'lucide-react';
import { resumeLink, type Content } from '@/lib/content';
import BandSlideshow from './band-slideshow';
import ResumePreview from '@/components/site/resume-preview';

const facts = [
  { label: 'Education', value: 'Computer Science, SKITM Indore (CGPA 8.07)' },
  { label: 'Focus', value: 'React Native, TypeScript, Android & iOS' },
  { label: 'Systems', value: 'Arch Linux, Hyprland, GNU Stow, Neovim' },
  { label: 'API & state', value: 'Redux Toolkit, REST APIs, Python, Django, SQL' }
];

/** The first sentence becomes the large statement; everything after it reads as body copy. */
function splitStatement(text: string) {
  const match = /^([\s\S]+?[.!?])\s+([\s\S]+)$/.exec(text.trim());
  return match ? { lead: match[1], rest: match[2] } : { lead: text.trim(), rest: '' };
}

export default function About({ content: c }: { content: Content }) {
  const paragraphs = c.about.split('\n').filter(Boolean);
  const { lead, rest } = splitStatement(paragraphs[0] || c.intro);
  const copy = [rest, ...paragraphs.slice(1)].filter(Boolean);
  const band = c.bandCaption.split('\n').filter(Boolean);
  const resume = resumeLink(c);
  // "Currently" is drawn from the rest of the site, so it stays true as the studio content changes.
  const building = c.projects.find(p => p.featured)?.title;
  const playing = c.games[0]?.name;
  const now = [
    building && { label: 'Building', value: building, href: '#work' },
    playing && { label: 'Playing', value: playing, href: '#games' },
    { label: 'Based in', value: 'Indore, India · IST' }
  ].filter(Boolean) as { label: string; value: string; href?: string }[];
  return (
    <>
      <section id="about" className="section-wrap" aria-labelledby="about-heading">
        <div className="section-heading">
          <div className="section-heading-lead">
            <span className="section-kicker">About</span>
            <h2 id="about-heading">
              The person <em>behind it</em>
            </h2>
          </div>
        </div>

        <div className="about-layout">
          <figure className="about-figure">
            {c.portrait && (
              <div className="about-flip" tabIndex={0}>
                <img
                  className="about-photo face-real"
                  src={c.portrait}
                  alt={'Portrait of ' + c.name}
                  loading="lazy"
                  decoding="async"
                />
                {c.portraitIllustrated && (
                  <img
                    className="about-photo face-anime"
                    src={c.portraitIllustrated}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            )}
            <figcaption>
              <span className="about-fig">Fig. 01</span>
              {c.name} — Indore, India
              {c.portraitIllustrated && <span className="flip-hint"> · hover for the anime version</span>}
            </figcaption>
          </figure>
          <div className="about-main">
            {/* Words are separate boxes so the statement can light up word by word as it scrolls in. */}
            <p className="about-statement" aria-label={lead}>
              {lead.split(/\s+/).map((word, i) => (
                <span className="about-word" aria-hidden="true" key={i}>
                  {word}{' '}
                </span>
              ))}
            </p>
            {copy.length > 0 && (
              <div className="about-copy">
                {copy.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
            <ul className="about-now" aria-label="Currently">
              {now.map(item => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  {item.href ? <a href={item.href}>{item.value}</a> : <b>{item.value}</b>}
                </li>
              ))}
            </ul>
            <dl className="about-facts">
              {facts.map((fact, i) => (
                <div key={fact.label}>
                  <dt>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {fact.label}
                  </dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="about-actions">
              <a className="solid-button" href={resume.href} download={resume.filename}>
                Download résumé <Download size={16} />
              </a>
              <ResumePreview
                src={c.resume}
                download={resume.href}
                filename={resume.filename}
                className="text-link"
              >
                Preview résumé <Eye size={14} />
              </ResumePreview>
              <a className="text-link" href="#contact">
                Get in touch <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <figure className="band">
        <BandSlideshow images={[...new Set([c.bandImage, ...c.bandSlides].filter(Boolean))]} />
        {band.length > 0 && (
          <figcaption>
            <span className="band-kicker">
              <i className="band-rule" aria-hidden="true" />
              Interlude
            </span>
            <span className="band-quote">
              {band.map((line, i) => {
                // Words are separate boxes so they can rise out of the line's mask one after another.
                const words = line.split(' ').map((word, j) => (
                  <Fragment key={j}>
                    {j > 0 && ' '}
                    <span className="band-word">{word}</span>
                  </Fragment>
                ));
                return (
                  <span className="line" key={i}>
                    <span>{i === band.length - 1 && band.length > 1 ? <em>{words}</em> : words}</span>
                  </span>
                );
              })}
            </span>
            {c.bandCredit && <span className="band-credit">{c.bandCredit}</span>}
          </figcaption>
        )}
      </figure>
    </>
  );
}
