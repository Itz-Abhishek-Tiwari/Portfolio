'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Save, Send, Eye, X, Undo2, Download, LogOut } from 'lucide-react';
import { contentSchema, type Content } from '@/lib/content';
import { themeIcon } from '@/lib/theme';
import { useStudioMotion } from '@/hooks/use-studio-motion';
import { jsonRequest, MAX_UPLOAD, prepareImage } from './studio-io';
import type { Issues, UpdateContent, UploadFile, UploadFiles } from './types';
import OverviewPanel from './panels/overview';
import ProfilePanel from './panels/profile';
import ProjectsPanel from './panels/projects';
import ExperiencePanel from './panels/experience';
import AppearancePanel from './panels/appearance';
import MusicPanel from './panels/music';
import ConnectionsPanel from './panels/connections';
import SkillsEditor from './skills-editor';
import AiToolsEditor from './ai-tools-editor';
import GamesEditor from './games-editor';
import IconStudio from './icon-studio';
import BlogEditor from './blog-editor';
import Inbox from './inbox';

const tabs = [
  'Overview',
  'Profile',
  'Projects',
  'Experience',
  'Appearance',
  'Connections',
  'Blog',
  'Music',
  'Skills',
  'AI tools',
  'Games',
  'Icons',
  'Inbox'
] as const;
type Tab = (typeof tabs)[number];

const intros: Partial<Record<Tab, string>> = {
  Appearance: 'A complete palette, applied throughout your site.',
  Projects: 'Curate your work, add images, and tell its story.',
  Skills: 'The languages, frameworks and tools shown on your site.',
  'AI tools': 'The AI assistants you work with, and what you use them for.',
  Games: 'The games you love, pulled from RAWG with their cover art.'
};

// The tab that owns the first invalid field, so a failed save can jump to it.
function tabForField(field: string | number | undefined): Tab {
  if (field === 'projects') return 'Projects';
  if (field === 'experience') return 'Experience';
  if (field === 'theme' || field === 'motion' || field === 'colorMode') return 'Appearance';
  if (field === 'music') return 'Music';
  if (field === 'skillItems') return 'Skills';
  if (field === 'aiTools') return 'AI tools';
  if (field === 'games') return 'Games';
  if (field === 'iconAssets' || field === 'iconStyle' || field === 'iconPromptTemplate') return 'Icons';
  return 'Profile';
}

type Removed =
  | { kind: 'projects'; index: number; item: Content['projects'][number] }
  | { kind: 'experience'; index: number; item: Content['experience'][number] };

export default function Studio({
  initial,
  initialRevision,
  initialUpdatedAt,
  publishedContent
}: {
  initial: Content;
  initialRevision: number;
  initialUpdatedAt: string | null;
  publishedContent: Content;
}) {
  const [content, setContent] = useState(initial),
    [saved, setSaved] = useState(initial),
    [published, setPublished] = useState(publishedContent),
    [revision, setRevision] = useState(initialRevision),
    [updatedAt, setUpdatedAt] = useState(initialUpdatedAt),
    [tab, setTab] = useState<Tab>('Overview'),
    [busy, setBusy] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(false),
    [issues, setIssues] = useState<Issues>({}),
    [conflict, setConflict] = useState(false),
    [removed, setRemoved] = useState<Removed | null>(null),
    [preview, setPreview] = useState(false);
  const studioRoot = useRef<HTMLElement>(null),
    contentRef = useRef(content),
    operation = useRef(false),
    frame = useRef<HTMLIFrameElement>(null),
    previewDialog = useRef<HTMLDialogElement>(null);
  // Event handlers and async saves read the latest edits through this ref.
  useLayoutEffect(() => {
    contentRef.current = content;
  }, [content]);
  useStudioMotion(studioRoot, tab, content.motion);

  // Serialise once per edit rather than on every render.
  const serialized = useMemo(() => JSON.stringify(content), [content]);
  const dirty = useMemo(() => serialized !== JSON.stringify(saved), [serialized, saved]),
    hasUnpublished = useMemo(() => serialized !== JSON.stringify(published), [serialized, published]);

  useEffect(() => {
    document.title = 'Portfolio studio — ' + content.name;
    document
      .querySelector<HTMLLinkElement>('link[rel="icon"]')
      ?.setAttribute('href', themeIcon(content.theme, content.colorMode));
  }, [content.theme, content.name, content.colorMode]);

  useEffect(() => {
    const dialog = previewDialog.current;
    if (preview && dialog && !dialog.open) dialog.showModal();
    if (!preview && dialog?.open) dialog.close();
  }, [preview]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Live preview: push every edit into the preview iframe, and answer when it reports ready.
  const sendPreview = useCallback(
    () =>
      frame.current?.contentWindow?.postMessage(
        { type: 'portfolio:preview', content: contentRef.current },
        window.location.origin
      ),
    []
  );
  useEffect(() => {
    if (preview) sendPreview();
  }, [content, preview, sendPreview]);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'portfolio:preview-ready'
      )
        sendPreview();
    };
    window.addEventListener('message', ready);
    return () => window.removeEventListener('message', ready);
  }, [sendPreview]);

  function showIssues(errors: { path: (string | number)[]; message: string }[]) {
    const next: Issues = {};
    errors.forEach(e => (next[e.path.join('.')] = e.message));
    setIssues(next);
    setTab(tabForField(errors[0]?.path[0]));
    requestAnimationFrame(() => document.getElementById('field-' + errors[0]?.path.join('.'))?.focus());
  }
  function fail(text: string) {
    setError(true);
    setMessage(text);
  }

  function openPreview() {
    const result = contentSchema.safeParse(contentRef.current);
    if (!result.success) {
      showIssues(result.error.issues);
      return fail('Fix the highlighted fields to preview your current edits.');
    }
    setPreview(true);
  }

  const update: UpdateContent = (key, value) => {
    setContent(c => ({ ...c, [key]: value }));
    setIssues(previous =>
      Object.fromEntries(
        Object.entries(previous).filter(([path]) => path !== key && !path.startsWith(String(key) + '.'))
      )
    );
    setMessage('');
  };

  async function save(publish: boolean) {
    if (operation.current) return;
    const snapshot = contentRef.current,
      result = contentSchema.safeParse(snapshot);
    if (!result.success) {
      showIssues(result.error.issues);
      return fail('Please fix the highlighted fields before saving.');
    }
    operation.current = true;
    setBusy(publish ? 'Publishing' : 'Saving');
    setError(false);
    setMessage('');
    try {
      const { response, body } = await jsonRequest('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: result.data, revision, publish })
      });
      if (!response.ok) {
        if (response.status === 409) setConflict(true);
        if (Array.isArray(body.issues))
          showIssues(body.issues as { path: (string | number)[]; message: string }[]);
        throw new Error(
          response.status === 403
            ? 'Your session has ended or this account is not authorized. Sign in again; your edits are kept.'
            : String(body.error || 'Save failed.')
        );
      }
      setRevision(Number(body.revision));
      setUpdatedAt(String(body.updatedAt));
      setSaved(result.data);
      if (contentRef.current === snapshot) setContent(result.data);
      if (publish) setPublished(result.data);
      setConflict(false);
      setMessage(
        publish
          ? 'Published successfully. The portfolio now shows this version.'
          : 'Draft saved. You can review it before publishing.'
      );
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Save failed. Your edits are still here.');
    } finally {
      operation.current = false;
      setBusy('');
    }
  }

  // One file to storage; returns its media URL or throws a message fit for the status line.
  async function send(file: File, kind: 'image' | 'resume') {
    if (!file.size) throw new Error('That file is empty.');
    if (kind === 'resume' && file.size > MAX_UPLOAD) throw new Error('Choose a file under 8 MB.');
    const prepared = kind === 'image' ? await prepareImage(file) : file;
    if (prepared.size > MAX_UPLOAD) throw new Error('That file is still over 8 MB. Choose a smaller one.');
    const form = new FormData();
    form.set('file', prepared);
    form.set('kind', kind);
    const { response, body } = await jsonRequest('/api/admin/upload', { method: 'POST', body: form });
    if (!response.ok) throw new Error(String(body.error || 'Upload failed.'));
    return String(body.url);
  }

  const upload: UploadFile = async (file, apply, kind) => {
    if (!file || operation.current) return;
    operation.current = true;
    setBusy('Uploading');
    setError(false);
    setMessage('');
    try {
      apply(await send(file, kind));
      setMessage('Uploaded. Save your draft or publish to use the new file.');
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      operation.current = false;
      setBusy('');
    }
  };

  // Several images in one go: sent one at a time, and whatever succeeded is applied together.
  const uploadMany: UploadFiles = async (files, apply) => {
    if (!files.length || operation.current) return;
    operation.current = true;
    setError(false);
    setMessage('');
    const urls: string[] = [],
      failed: string[] = [];
    try {
      for (const [i, file] of files.entries()) {
        setBusy(files.length > 1 ? `Uploading ${i + 1} of ${files.length}` : 'Uploading');
        try {
          urls.push(await send(file, 'image'));
        } catch (e) {
          failed.push(file.name + (e instanceof Error ? ' (' + e.message + ')' : ''));
        }
      }
      if (urls.length) apply(urls);
      if (failed.length)
        fail(
          (urls.length ? `Uploaded ${urls.length} of ${files.length}. ` : '') +
            'Not uploaded: ' +
            failed.join(', ')
        );
      else
        setMessage(
          (urls.length > 1 ? `Uploaded ${urls.length} images.` : 'Uploaded.') +
            ' Save your draft or publish to use them.'
        );
    } finally {
      operation.current = false;
      setBusy('');
    }
  };

  function remove(entry: Removed) {
    setRemoved(entry);
    update(
      entry.kind,
      (content[entry.kind] as { id: string }[]).filter(
        (_, j) => j !== entry.index
      ) as Content[typeof entry.kind]
    );
  }
  function undoRemoval() {
    if (!removed) return;
    setContent(c => {
      const rows = [...c[removed.kind]] as { id: string }[];
      if (!rows.some(row => row.id === removed.item.id))
        rows.splice(Math.min(removed.index, rows.length), 0, removed.item);
      return { ...c, [removed.kind]: rows };
    });
    setRemoved(null);
  }

  async function loadLatest() {
    if (operation.current) return;
    operation.current = true;
    setBusy('Loading');
    try {
      const { response, body } = await jsonRequest('/api/admin/content');
      if (!response.ok) throw new Error(String(body.error || 'Could not load the latest draft.'));
      const next = contentSchema.parse(body.content),
        live = contentSchema.parse(body.published);
      setContent(next);
      setSaved(next);
      setPublished(live);
      setRevision(Number(body.revision));
      setUpdatedAt(body.updatedAt ? String(body.updatedAt) : null);
      setConflict(false);
      setIssues({});
      setError(false);
      setMessage('Latest draft loaded.');
      setRemoved(null);
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Load failed.');
    } finally {
      operation.current = false;
      setBusy('');
    }
  }

  function downloadBackup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'portfolio-draft.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function signOut(event: React.MouseEvent) {
    event.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  const panelProps = { content, update, issues };
  return (
    <main ref={studioRoot} className={'studio theme-' + content.theme + ' mode-' + content.colorMode}>
      <header className="studio-header">
        <a className="brand" href="/admin">
          <span>Portfolio studio</span>
        </a>
        <div className="studio-header-actions">
          {tab === 'Blog' || tab === 'Inbox' ? (
            <a
              className="outline-button"
              href={tab === 'Inbox' ? '/#contact' : '/blog'}
              target="_blank"
              rel="noreferrer"
            >
              {tab === 'Inbox' ? 'Open contact form' : 'Open journal'} <ArrowUpRight size={15} />
            </a>
          ) : (
            <>
              <span className="studio-state">
                <i className={dirty ? 'unsaved' : ''} />
                {dirty ? 'Unsaved edits' : hasUnpublished ? 'Saved draft' : 'Published'}
              </span>
              <button className="outline-button" onClick={openPreview}>
                <Eye size={16} />
                Preview
              </button>
              <button className="outline-button" disabled={!!busy || !dirty} onClick={() => save(false)}>
                <Save size={16} />
                {busy === 'Saving' ? 'Saving…' : 'Save draft'}
              </button>
              <button
                className="solid-button"
                disabled={!!busy || !hasUnpublished}
                onClick={() => save(true)}
              >
                <Send size={15} />
                {busy === 'Publishing' ? 'Publishing…' : 'Publish'}
              </button>
            </>
          )}
        </div>
      </header>
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <span className="section-kicker">CONTENT</span>
          {tabs.map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
          <div className="studio-sidebar-bottom">
            <a href="/" target="_blank" rel="noreferrer">
              View website <ArrowUpRight size={16} />
            </a>
            <a href="/admin" onClick={signOut}>
              Sign out <LogOut size={16} />
            </a>
          </div>
        </aside>
        <section className="studio-main">
          <div className="studio-main-top">
            <span className="studio-tab-line" aria-hidden="true" />
            <div>
              <span className="section-kicker">PRIVATE STUDIO / {tab.toUpperCase()}</span>
              <h1>{tab === 'Overview' ? 'Welcome back.' : tab}</h1>
              <p>{intros[tab] ?? 'Shape the portfolio around the work you want to show.'}</p>
            </div>
          </div>
          {message && (
            <div
              className={'studio-status ' + (error ? 'error' : 'success')}
              role={error ? 'alert' : 'status'}
            >
              {message}
              {error && message.includes('session') && (
                <a href="/admin" target="_top">
                  Sign in again ↗
                </a>
              )}
            </div>
          )}
          {conflict && (
            <div className="conflict-panel">
              <p>
                Your local edits have been kept. Download a backup before loading the latest saved version.
              </p>
              <button className="outline-button" onClick={downloadBackup}>
                <Download size={15} />
                Download backup
              </button>
              <button className="outline-button" onClick={loadLatest}>
                Load latest and discard local edits
              </button>
            </div>
          )}
          {removed && (
            <div className="undo-notice">
              Removed from this draft.{' '}
              <button onClick={undoRemoval}>
                <Undo2 size={14} />
                Undo
              </button>
            </div>
          )}
          <fieldset disabled={!!busy} className="studio-fields">
            {tab === 'Overview' && (
              <OverviewPanel
                content={content}
                dirty={dirty}
                hasUnpublished={hasUnpublished}
                onEditProfile={() => setTab('Profile')}
                onPreview={openPreview}
                onBackup={downloadBackup}
              />
            )}
            {tab === 'Profile' && <ProfilePanel {...panelProps} upload={upload} uploadMany={uploadMany} />}
            {tab === 'Projects' && (
              <ProjectsPanel
                {...panelProps}
                upload={upload}
                onRemove={(index, item) => remove({ kind: 'projects', index, item })}
              />
            )}
            {tab === 'Experience' && (
              <ExperiencePanel
                {...panelProps}
                upload={upload}
                onRemove={(index, item) => remove({ kind: 'experience', index, item })}
              />
            )}
            {tab === 'Skills' && (
              <SkillsEditor
                content={content}
                issues={issues}
                onChange={items => update('skillItems', items)}
                onAssets={assets => update('iconAssets', assets)}
                onUpload={(file, apply) => upload(file, apply, 'image')}
              />
            )}
            {tab === 'AI tools' && (
              <AiToolsEditor content={content} issues={issues} onChange={tools => update('aiTools', tools)} />
            )}
            {tab === 'Games' && (
              <GamesEditor content={content} issues={issues} onChange={games => update('games', games)} />
            )}
            {tab === 'Icons' && (
              <IconStudio
                content={content}
                issues={issues}
                onAssets={assets => update('iconAssets', assets)}
                onStyle={style => update('iconStyle', style)}
                onTemplate={template => update('iconPromptTemplate', template)}
                onUpload={(file, apply) => upload(file, apply, 'image')}
              />
            )}
            {tab === 'Appearance' && (
              <AppearancePanel content={content} update={update} onPreview={openPreview} />
            )}
            {tab === 'Inbox' && <Inbox />}
            {tab === 'Blog' && <BlogEditor />}
            {tab === 'Music' && <MusicPanel {...panelProps} />}
            {tab === 'Connections' && (
              <ConnectionsPanel content={content} update={update} onMessage={setMessage} />
            )}
          </fieldset>
          {updatedAt && (
            <p className="saved-time">
              Last saved{' '}
              {new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
              }).format(new Date(updatedAt))}{' '}
              · Revision {revision}
            </p>
          )}
        </section>
      </div>
      <dialog
        ref={previewDialog}
        className="preview-drawer"
        aria-label="Preview current edits"
        onCancel={() => setPreview(false)}
        onClose={() => setPreview(false)}
      >
        {preview && (
          <>
            <div className="preview-drawer-top">
              <div>
                <Eye size={18} />
                <span>
                  Current edits <small>Unsaved changes are included</small>
                </span>
              </div>
              <button
                className="icon-button"
                aria-label="Close preview"
                onClick={() => setPreview(false)}
                autoFocus
              >
                <X size={21} />
              </button>
            </div>
            <iframe
              ref={frame}
              title="Portfolio preview"
              src="/admin/preview?embedded=1"
              onLoad={sendPreview}
            />
          </>
        )}
      </dialog>
    </main>
  );
}
