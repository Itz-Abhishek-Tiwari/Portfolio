import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readContent } from '@/lib/server/content-store';
import { projectLinks } from '@/lib/projects';
import { isAdmin } from '@/lib/server/auth';
import SiteShell from '@/components/site/site-shell';
import { siteInfo } from '@/lib/site';
import Markdown from '@/components/ui/markdown';
import { ArrowLeft, ArrowUpRight, Code2 } from 'lucide-react';
import { ProjectArt } from '@/components/ui/project-art';
export const dynamic = 'force-dynamic';
export default async function ProjectPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params,
    { preview } = await searchParams,
    draft = preview === '1' && (await isAdmin());
  const { content } = await readContent(draft);
  const project = content.projects.find(p => (draft || p.featured) && (p.slug || p.id) === slug);
  if (!project) notFound();
  const links = projectLinks(project);
  const body =
    project.body ||
    `## Overview\n\n${project.description}\n\n## My contribution\n\n${project.story || project.description}\n\n## Tools and technologies\n\n${project.stack
      .split('/')
      .map(s => '- ' + s.trim())
      .join('\n')}`;
  return (
    <SiteShell site={siteInfo(content)} draft={draft}>
      <div className="project-detail section-wrap">
        <Link className="back-link" href="/#work">
          <ArrowLeft size={16} />
          Selected work
        </Link>
        {draft && <span className="draft-badge">PRIVATE DRAFT PREVIEW</span>}
        <header className="detail-heading">
          <span className="section-kicker">PROJECT CASE STUDY / {project.category}</span>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <div className="detail-links">
            {links.live && (
              <a className="solid-button" href={links.live} target="_blank" rel="noreferrer">
                Open live site <ArrowUpRight size={17} />
              </a>
            )}
            {links.github && (
              <a className="outline-button" href={links.github} target="_blank" rel="noreferrer">
                View GitHub <Code2 size={17} />
              </a>
            )}
          </div>
        </header>
        <div className="detail-art">
          {project.image ? <img src={project.image} alt={project.title} /> : <ProjectArt project={project} />}
        </div>
        <div className="reading-layout">
          <aside>
            <span className="section-kicker">PROJECT DETAILS</span>
            <span>{project.category}</span>
            <div className="project-tools">
              {project.stack.split('/').map(s => (
                <span key={s}>{s.trim()}</span>
              ))}
            </div>
          </aside>
          <article>
            <Markdown body={body} />
            {!links.github && (
              <p className="story-private">
                Source code for this professional contribution is not publicly shared.
              </p>
            )}
          </article>
        </div>
      </div>
    </SiteShell>
  );
}
