import { effectiveSkills } from '@/lib/icon-system';
import type { Content } from '@/lib/content';
import SiteIcon from '@/components/ui/site-icon';

export default function Skills({ content: c }: { content: Content }) {
  const skills = effectiveSkills(c);
  const groups = [...new Set(skills.map(s => s.category))].map(category => ({
    category,
    items: skills.filter(s => s.category === category)
  }));
  return (
    <section className="section-wrap" id="skills" aria-labelledby="skills-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">Skills</span>
          <h2 id="skills-heading">
            What I work <em>with</em>
          </h2>
        </div>
        <div className="section-heading-aside">
          <p>The languages, frameworks and tools I reach for every day.</p>
        </div>
      </div>
      {groups.length ? (
        <div className="skill-groups">
          {groups.map(g => (
            <div className="skill-group" key={g.category}>
              <h3>
                {g.category}
                <span>{String(g.items.length).padStart(2, '0')}</span>
              </h3>
              <ul>
                {g.items.map(s => (
                  <li key={s.id}>
                    <span className="skill-mark">
                      <SiteIcon name={s.name} assets={c.iconAssets} style={c.iconStyle} size={26} />
                    </span>
                    <span>{s.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">Skills will appear here when added in the studio.</p>
      )}
    </section>
  );
}
