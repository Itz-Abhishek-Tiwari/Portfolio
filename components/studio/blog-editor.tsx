'use client';
import { useEffect, useState } from 'react';
import type { Post, PostRow } from '@/lib/posts';
import Markdown from '@/components/ui/markdown';
const empty: Post = { title: '', slug: '', excerpt: '', body: '', cover: '', tags: [] };
export default function BlogEditor() {
  const [rows, setRows] = useState<PostRow[]>([]),
    [selected, setSelected] = useState<PostRow | null>(null),
    [post, setPost] = useState<Post>(empty),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [preview, setPreview] = useState(false),
    [tagsText, setTagsText] = useState(''),
    [showArchived, setShowArchived] = useState(false);
  async function load() {
    const r = await fetch('/api/admin/posts');
    const data = (await r.json()) as { error: string; posts: PostRow[]; url: string };
    if (!r.ok) throw Error(data.error);
    setRows(data.posts);
    return data.posts as PostRow[];
  }
  // This effect loads remote records; state updates occur after the request resolves.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(e => setMessage(e.message));
  }, []);
  function edit(row: PostRow) {
    if (
      selected &&
      JSON.stringify(post) !== JSON.stringify(selected.draft) &&
      !confirm('Discard unsaved article changes?')
    )
      return;
    setSelected(row);
    setPost(row.draft);
    setTagsText(row.draft.tags.join(', '));
    setMessage('');
  }
  function create() {
    edit({
      id: crypto.randomUUID(),
      slug: '',
      draft: { ...empty },
      published: null,
      revision: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null,
      archived: false
    });
  }
  async function persist(publish: boolean) {
    if (!selected || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, content: post, revision: selected.revision, publish })
      });
      const result = (await response.json()) as {
        error: string;
        issues?: { path: string[]; message: string }[];
      };
      if (!response.ok)
        throw Error(
          result.issues?.length
            ? result.issues
                .map((i: { path: string[]; message: string }) => i.path.join('.') + ': ' + i.message)
                .join(' · ')
            : result.error
        );
      const updated = (await load()).find(r => r.id === selected.id)!;
      setSelected(updated);
      setPost(updated.draft);
      setMessage(publish ? 'Article published.' : 'Draft saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }
  async function state(action: 'archive' | 'restore' | 'unpublish') {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, revision: selected.revision, action })
      });
      const data = (await r.json()) as { error: string; posts: PostRow[]; url: string };
      if (!r.ok) throw Error(data.error);
      const updated = (await load()).find(row => row.id === selected.id)!;
      setSelected(updated);
      setPost(updated.draft);
      setMessage('Article status updated.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', 'image');
      const r = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const result = (await r.json()) as { error: string; posts: PostRow[]; url: string };
      if (!r.ok) throw Error(result.error);
      setPost(p => ({ ...p, cover: result.url }));
      setMessage('Cover uploaded. Save the article to keep it.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="blog-editor">
      <div className="panel-top">
        <h2>Journal studio</h2>
        <button className="solid-button" onClick={create} disabled={busy}>
          New article
        </button>
      </div>
      <p role="status" className="studio-status">
        {message}
      </p>
      <div className="blog-editor-layout">
        <aside className="post-list">
          <button onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          {rows
            .filter(r => showArchived || !r.archived)
            .map(row => (
              <button
                disabled={busy}
                key={row.id}
                className={selected?.id === row.id ? 'active' : ''}
                onClick={() => edit(row)}
              >
                <b>{row.draft.title}</b>
                <small>{row.archived ? 'Archived' : row.published ? 'Published' : 'Draft'}</small>
              </button>
            ))}
        </aside>
        {selected ? (
          <fieldset disabled={busy} className="post-form">
            <div className="panel-top">
              <span className="section-kicker">
                {JSON.stringify(post) !== JSON.stringify(selected.draft) ? 'UNSAVED CHANGES' : 'SAVED DRAFT'}
              </span>
              <button className="outline-button" onClick={() => setPreview(!preview)}>
                {preview ? 'Edit Markdown' : 'Preview Markdown'}
              </button>
            </div>
            {(['title', 'slug', 'excerpt'] as const).map(key => (
              <label className="field" key={key}>
                {key}
                <input
                  value={post[key]}
                  onChange={e =>
                    setPost({
                      ...post,
                      [key]: e.target.value,
                      ...(key === 'title' && selected.revision === 0
                        ? {
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, '')
                          }
                        : {})
                    })
                  }
                />
              </label>
            ))}
            <label className="field">
              Topics, separated by commas
              <input
                value={tagsText}
                onChange={e => {
                  setTagsText(e.target.value);
                  setPost({
                    ...post,
                    tags: e.target.value
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                  });
                }}
              />
            </label>
            <label className="field">
              Cover image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e => {
                  if (e.target.files?.[0]) upload(e.target.files[0]);
                  e.target.value = '';
                }}
              />
            </label>
            {post.cover && <img className="post-cover-preview" src={post.cover} alt="Article cover" />}
            {preview ? (
              <div className="markdown-body">
                <Markdown body={post.body} />
              </div>
            ) : (
              <label className="field">
                Article · Markdown
                <textarea
                  rows={24}
                  value={post.body}
                  onChange={e => setPost({ ...post, body: e.target.value })}
                />
              </label>
            )}
            <div className="post-actions">
              <button className="outline-button" onClick={() => persist(false)}>
                Save draft
              </button>
              <button className="solid-button" disabled={selected.archived} onClick={() => persist(true)}>
                Publish article
              </button>
              {selected.revision > 0 && (
                <>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    className="text-link"
                    href={'/blog/' + (post.slug || 'preview') + '?preview=' + selected.id}
                  >
                    Saved preview ↗
                  </a>
                  {selected.published && (
                    <button className="text-button" onClick={() => state('unpublish')}>
                      Unpublish
                    </button>
                  )}
                  <button
                    className="text-button"
                    onClick={() => state(selected.archived ? 'restore' : 'archive')}
                  >
                    {selected.archived ? 'Restore' : 'Archive'}
                  </button>
                </>
              )}
            </div>
          </fieldset>
        ) : (
          <p>Select an article or start a new draft.</p>
        )}
      </div>
    </div>
  );
}
