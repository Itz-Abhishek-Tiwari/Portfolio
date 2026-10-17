import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';

export default function Experience({ content: c }: { content: Content }) {
  return (
    <section id="journey" className="section-wrap" aria-labelledby="journey-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">Experience</span>
          <h2 id="journey-heading">
            Where I&apos;ve <em>worked</em>
          </h2>
        </div>
      </div>
      <div className="experience-grid">
        {c.experience.map(exp => (
          <article className="experience" key={exp.id}>
            <span className="period">{exp.period}</span>
            <header>
              <span className="exp-logo">
                <SiteIcon name={exp.company} kind="company" assets={c.iconAssets} style="brand" size={40} />
              </span>
              <div>
                <h3>{exp.role}</h3>
                <span className="company">{exp.company}</span>
              </div>
            </header>
            <p>{exp.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
