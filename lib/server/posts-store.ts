import { cache } from 'react';
import { DatabaseError, readDoc, writeDoc } from './db';
import { postSchema, type Post, type PostRow } from '@/lib/posts';

// Every post lives in one document, so the journal is a single read and a save can check slugs
// and revisions against the whole set before its conditional write.
const PATH = 'data/posts.json';

const readPosts = cache(async () => (await readDoc<PostRow[]>(PATH))?.data ?? []);

export async function listPosts(admin = false) {
  const rows = (await readPosts())
    .filter(row => admin || (!row.archived && row.published))
    .sort((a, b) =>
      admin
        ? b.updated_at.localeCompare(a.updated_at)
        : (b.published_at ?? '').localeCompare(a.published_at ?? '')
    )
    .slice(0, 100);
  return rows.map(row => ({
    ...row,
    revision: Number(row.revision),
    draft: postSchema.parse(row.draft),
    published: row.published ? postSchema.parse(row.published) : null
  }));
}
// Cached so generateMetadata and the page share one read.
export const publishedPost = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const row = (await readPosts()).find(r => !r.archived && r.published?.slug === slug);
  return row ? { ...row, published: postSchema.parse(row.published) } : null;
});
export async function draftPost(id: string) {
  return (await readPosts()).find(row => row.id === id) || null;
}

const SLUG_TAKEN = 'This slug is already used. Choose a different slug.';
const liveSlugTaken = (rows: PostRow[], id: string, slug: string | undefined) =>
  rows.some(r => r.id !== id && !r.archived && r.published?.slug === slug);

/** Applies `change` to one post if its revision still matches, then writes the whole set back. */
async function changePost(
  id: string,
  revision: number,
  conflict: string,
  change: (row: PostRow | undefined, rows: PostRow[], now: string) => PostRow
) {
  const doc = await readDoc<PostRow[]>(PATH),
    rows = doc?.data ?? [],
    index = rows.findIndex(row => row.id === id);
  if ((index < 0 ? 0 : Number(rows[index].revision)) !== revision) throw new DatabaseError(conflict, 409);
  const row = change(rows[index], rows, new Date().toISOString());
  await writeDoc(PATH, index < 0 ? [...rows, row] : rows.with(index, row), doc?.etag ?? null, conflict);
  return row;
}

export async function savePost(id: string, content: Post, revision: number, publish: boolean) {
  const row = await changePost(
    id,
    revision,
    'This post changed in another session, or the slug is already used. Reload or choose another slug.',
    (old, rows, now) => {
      const published = publish ? content : (old?.published ?? null);
      if (
        rows.some(r => r.id !== id && r.slug === content.slug) ||
        (published && liveSlugTaken(rows, id, published.slug))
      )
        throw new DatabaseError(SLUG_TAKEN, 409);
      return {
        id,
        slug: content.slug,
        draft: content,
        published,
        revision: revision + 1,
        created_at: old?.created_at ?? now,
        updated_at: now,
        published_at: publish ? (old?.published_at ?? now) : (old?.published_at ?? null),
        archived: false
      };
    }
  );
  return { id: row.id, revision: row.revision, updatedAt: row.updated_at, publishedAt: row.published_at };
}

export async function setPostState(id: string, revision: number, action: 'unpublish' | 'archive' | 'restore') {
  const conflict = 'This post changed in another session. Reload before trying again.';
  const row = await changePost(id, revision, conflict, (old, rows, now) => {
    if (!old) throw new DatabaseError(conflict, 409);
    if (action === 'restore' && old.published && liveSlugTaken(rows, id, old.published.slug))
      throw new DatabaseError(SLUG_TAKEN, 409);
    return {
      ...old,
      published: action === 'unpublish' ? null : old.published,
      archived: action === 'archive' ? true : action === 'restore' ? false : old.archived,
      revision: revision + 1,
      updated_at: now
    };
  });
  return { id: row.id, revision: row.revision, updatedAt: row.updated_at };
}
