import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Content } from '@/lib/content';
import { projectPath, projectLinks } from '@/lib/projects';
import { ProjectArt } from '@/components/ui/project-art';
import ShowMore from './show-more';

const VISIBLE = 3;

export default function Projects({
  projects,
  draftMode
}: {
  projects: Content['projects'];
  draftMode: boolean;
}) {
  return (
    <section id="work" className="section-wrap" aria-labelledby="work-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">Selected work</span>
          <h2 id="work-heading">
            Things I&apos;ve <em>built</em>
          </h2>
        </div>
      </div>

      <div className="project-list" id="project-list" data-collapsible>
        {projects.map((project, index) => {
          const links = projectLinks(project);
          const detailPath = projectPath(project) + (draftMode ? '?preview=1' : '');
          const tools = project.stack
            .split('/')
            .map(t => t.trim())
            .filter(Boolean)
            .join(', ');
          return (
            <article
              className={'project' + (index >= VISIBLE ? ' is-extra' : '')}
              key={project.id}
              id={'project-' + project.id}
            >
              <span className="project-no">{String(index + 1).padStart(2, '0')}</span>
              <div className="project-body">
                <h3 className="project-title">
                  <Link href={detailPath}>{project.title}</Link>
                </h3>
                <span className="project-meta">
                  {project.category}
                  {tools && ' · ' + tools}
                </span>
                <p className="project-desc">{project.description}</p>
                <div className="project-actions">
                  <Link href={detailPath} className="text-link">
                    Case study <ArrowUpRight size={14} />
                  </Link>
                  {links.github && (
                    <a href={links.github} target="_blank" rel="noreferrer" className="text-link">
                      Source <ArrowUpRight size={14} />
                    </a>
                  )}
                  {links.live && (
                    <a href={links.live} target="_blank" rel="noreferrer" className="text-link">
                      Live <ArrowUpRight size={14} />
                    </a>
                  )}
                </div>
              </div>
              <Link
                href={detailPath}
                className="project-card"
                aria-label={'Explore ' + project.title}
                tabIndex={-1}
              >
                <div className="project-visual">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title + ' cover'}
                      className="project-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <ProjectArt project={project} />
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
      {projects.length > VISIBLE && (
        <ShowMore target="project-list" hidden={projects.length - VISIBLE} noun="projects" />
      )}
      {!projects.length && (
        <div className="empty-state" role="status">
          Projects will appear here once published.
        </div>
      )}
    </section>
  );
}
