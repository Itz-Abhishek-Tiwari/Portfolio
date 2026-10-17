import { Image as ImageIcon, Plus } from 'lucide-react';
import type { Content } from '@/lib/content';
import { Field } from '../field';
import type { PanelProps, UploadFile } from '../types';
import RowControls, { moved } from './row-controls';

type Project = Content['projects'][number];
export const MAX_PROJECTS = 30;

export function blankProject(overrides: Partial<Project> = {}): Project {
  return {
    id: crypto.randomUUID(),
    title: 'New project',
    category: 'Web',
    description: 'Describe what you built and your contribution.',
    story: '',
    body: '',
    slug: '',
    liveUrl: '',
    githubUrl: '',
    stack: '',
    url: '',
    image: '',
    featured: false,
    ...overrides
  };
}

export default function ProjectsPanel({
  content,
  update,
  issues,
  upload,
  onRemove
}: PanelProps & { upload: UploadFile; onRemove: (index: number, item: Project) => void }) {
  const projects = content.projects;
  const edit = (i: number, key: keyof Project, value: unknown) =>
    update(
      'projects',
      projects.map((p, j) => (j === i ? { ...p, [key]: value } : p))
    );
  return (
    <>
      {projects.map((p, i) => {
        const text = (
          label: string,
          key: keyof Project,
          options: { area?: boolean; full?: boolean; type?: string; hint?: string } = {}
        ) => (
          <Field
            label={label}
            path={'projects.' + i + '.' + key}
            value={String(p[key] ?? '')}
            onChange={value => edit(i, key, value)}
            issues={issues}
            {...options}
          />
        );
        return (
          <div className="editor-panel project-editor" key={p.id}>
            <div className="panel-top">
              <div>
                <span className="section-kicker">PROJECT {String(i + 1).padStart(2, '0')}</span>
                <h3>{p.title || 'Untitled project'}</h3>
              </div>
              <RowControls
                index={i}
                count={projects.length}
                label={p.title}
                removeLabel={'Remove ' + p.title + ' from draft'}
                onMove={direction => update('projects', moved(projects, i, direction))}
                onRemove={() => onRemove(i, p)}
              />
            </div>
            <div className="editor-grid">
              {text('Project title', 'title')}
              <label className="field">
                <span>Category</span>
                <select value={p.category} onChange={e => edit(i, 'category', e.target.value)}>
                  {['Mobile', 'Web', 'Systems'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {text('Your contribution', 'description', { area: true, full: true })}
              {text('Expanded project story', 'story', { area: true, full: true })}
              {text('Full case study (Markdown)', 'body', {
                area: true,
                full: true,
                hint: 'Headings, lists, code blocks, links, and images are supported. This appears on the full project page.'
              })}
              {text('Page slug', 'slug', { hint: 'Optional. Leave blank to keep the existing project URL.' })}
              {text('Live site URL', 'liveUrl', { type: 'url' })}
              {text('GitHub repository URL', 'githubUrl', { type: 'url' })}
              {text('Technology stack', 'stack', { hint: 'Separate technologies with /.' })}
              {text('Project or source URL', 'url', { type: 'url', hint: 'Optional for professional work.' })}
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={p.featured}
                  onChange={e => edit(i, 'featured', e.target.checked)}
                />
                Show on the portfolio
              </label>
            </div>
            <div className="project-image-editor">
              {p.image && <img src={p.image} alt={p.title + ' cover'} />}
              <label className="asset-upload">
                <ImageIcon size={16} />
                <span>{p.image ? 'Replace project image' : 'Add a project image'}</span>
                <input
                  aria-label={'Upload ' + p.title + ' project image'}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => {
                    upload(e.target.files?.[0], url => edit(i, 'image', url), 'image');
                    e.target.value = '';
                  }}
                />
                <small>Optional. A custom image replaces the built-in artwork.</small>
              </label>
              {p.image && (
                <button className="text-button" onClick={() => edit(i, 'image', '')}>
                  Use built-in artwork
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button
        className="outline-button add-button"
        disabled={projects.length >= MAX_PROJECTS}
        onClick={() => update('projects', [...projects, blankProject()])}
      >
        <Plus size={17} />
        Add project
      </button>
    </>
  );
}
