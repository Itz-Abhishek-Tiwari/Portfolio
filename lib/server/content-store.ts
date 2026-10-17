import { cache } from 'react';
import { dataRequest, query } from './db';
import { initialContent, contentSchema, type Content } from '@/lib/content';

type Row = { draft: unknown; published: unknown; revision: number; updated_at: string };

// One row holds both the draft and the published content. Fetch it once per request,
// however many server components (layout, page, metadata) ask for it.
const readRow = cache(async () => {
  const rows = await dataRequest<Row[]>(
    'portfolio_content?' + query({ id: 'eq.main', select: 'draft,published,revision,updated_at', limit: '1' })
  );
  return rows[0] ?? null;
});

function version(row: Row | null, draft: boolean) {
  if (!row) return { content: initialContent, revision: 0, updatedAt: null };
  return {
    content: contentSchema.parse(draft ? row.draft : row.published),
    revision: Number(row.revision),
    updatedAt: row.updated_at
  };
}

/** The published content, or the saved draft when `draft` is true. */
export const readContent = cache(async (draft: boolean = false) => version(await readRow(), draft));

/** Both versions from a single database read (studio and its API). */
export async function readDraftAndPublished() {
  const row = await readRow();
  return { draft: version(row, true), published: version(row, false) };
}

export async function saveContent(content: Content, revision: number, publish: boolean) {
  return dataRequest<{ revision: number; updatedAt: string }>('rpc/portfolio_save_content', {
    method: 'POST',
    body: JSON.stringify({
      p_content: content,
      p_initial: initialContent,
      p_revision: revision,
      p_publish: publish
    })
  });
}
