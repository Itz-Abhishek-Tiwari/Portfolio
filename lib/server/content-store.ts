import { cache } from 'react';
import { DatabaseError, readDoc, writeDoc } from './db';
import { initialContent, contentSchema, type Content } from '@/lib/content';

const PATH = 'data/content.json';
type Row = { draft: unknown; published: unknown; revision: number; updated_at: string };

// One document holds both the draft and the published content. Fetch it once per request,
// however many server components (layout, page, metadata) ask for it.
const readRow = cache(async (fresh: boolean) => (await readDoc<Row>(PATH, fresh))?.data ?? null);

function version(row: Row | null, draft: boolean) {
  if (!row) return { content: initialContent, revision: 0, updatedAt: null };
  return {
    content: contentSchema.parse(draft ? row.draft : row.published),
    revision: Number(row.revision),
    updatedAt: row.updated_at
  };
}

/** The published content, or the saved draft when `draft` is true. */
export const readContent = cache(async (draft: boolean = false) => version(await readRow(draft), draft));

/** Both versions from a single read (studio and its API). */
export async function readDraftAndPublished() {
  const row = await readRow(true);
  return { draft: version(row, true), published: version(row, false) };
}

export async function saveContent(content: Content, revision: number, publish: boolean) {
  const conflict = 'A newer draft exists. Reload the latest draft before saving.';
  const doc = await readDoc<Row>(PATH, true);
  if ((doc?.data.revision ?? 0) !== revision) throw new DatabaseError(conflict, 409);
  const row: Row = {
    draft: content,
    published: publish ? content : (doc?.data.published ?? initialContent),
    revision: revision + 1,
    updated_at: new Date().toISOString()
  };
  await writeDoc(PATH, row, doc?.etag ?? null, conflict);
  return { revision: row.revision, updatedAt: row.updated_at };
}
