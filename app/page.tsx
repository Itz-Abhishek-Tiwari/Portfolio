import { readContent } from '@/lib/server/content-store';
import { listPosts } from '@/lib/server/posts-store';
import Portfolio from '@/components/home/portfolio';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { content } = await readContent();
  // The journal teaser is optional: if the database is unavailable the rest of the page still renders.
  const posts = await listPosts()
    .then(rows =>
      rows.slice(0, 3).map(p => ({
        slug: p.published!.slug,
        title: p.published!.title,
        excerpt: p.published!.excerpt,
        tags: p.published!.tags,
        publishedAt: p.published_at
      }))
    )
    .catch(() => []);
  return <Portfolio content={content} posts={posts} />;
}
