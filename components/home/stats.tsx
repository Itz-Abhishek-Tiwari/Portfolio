import type { Content } from '@/lib/content';
import { effectiveSkills } from '@/lib/icon-system';

export default function Stats({ content: c, postCount }: { content: Content; postCount: number }) {
  const stats = [
    { value: c.projects.filter(p => p.featured).length, label: 'Featured projects' },
    { value: effectiveSkills(c).length, label: 'Technologies' },
    { value: c.experience.length, label: 'Professional roles' },
    { value: postCount, label: 'Latest articles' }
  ].filter(stat => stat.value > 0);
  if (!stats.length) return null;
  return (
    <section className="stats" aria-label="At a glance">
      {stats.map(stat => (
        <div className="stat" key={stat.label}>
          <b data-count={stat.value}>{stat.value}</b>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
