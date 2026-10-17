import type { Content } from './content';
export function projectPath(project: Content['projects'][number]) {
  return '/projects/' + encodeURIComponent(project.slug || project.id);
}
export function projectLinks(project: Content['projects'][number]) {
  const legacy = project.url || '',
    github = project.githubUrl || (/^https?:\/\/(www\.)?github\.com\//.test(legacy) ? legacy : '');
  return { github, live: project.liveUrl || (!github ? legacy : '') };
}
