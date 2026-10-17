import { cache } from 'react';
import { dataRequest, query } from './db';
import { postSchema, type PostRow } from '@/lib/posts';
export async function listPosts(admin = false) {
  const parameters: Record<string, string> = {
    select: '*',
    order: admin ? 'updated_at.desc' : 'published_at.desc',
    limit: '100'
  };
  if (!admin) {
    parameters.archived = 'eq.false';
    parameters.published = 'not.is.null';
  }
  const rows = await dataRequest<PostRow[]>('portfolio_posts?' + query(parameters));
  return rows.map(row => ({
    ...row,
    revision: Number(row.revision),
    draft: postSchema.parse(row.draft),
    published: row.published ? postSchema.parse(row.published) : null
  }));
}
// Cached so generateMetadata and the page share one query.
export const publishedPost = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const rows = await dataRequest<PostRow[]>(
    'portfolio_posts?' +
      query({
        'published->>slug': 'eq.' + slug,
        archived: 'eq.false',
        published: 'not.is.null',
        select: '*',
        limit: '1'
      })
  );
  return rows[0] ? { ...rows[0], published: postSchema.parse(rows[0].published) } : null;
});
export async function draftPost(id: string) {
  const rows = await dataRequest<PostRow[]>(
    'portfolio_posts?' + query({ id: 'eq.' + id, select: '*', limit: '1' })
  );
  return rows[0] || null;
}
