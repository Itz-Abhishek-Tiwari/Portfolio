import { listPosts } from '@/lib/server/posts-store';
import { readContent } from '@/lib/server/content-store';
import { siteInfo } from '@/lib/site';
import SiteShell from '@/components/site/site-shell';
import BlogIndex from '@/components/blog/blog-index';
export const dynamic = 'force-dynamic';
export default async function Blog() {
  const [{ content }, posts] = await Promise.all([readContent(), listPosts()]);
  return (
    <SiteShell site={siteInfo(content)}>
      <BlogIndex
        posts={posts.map(({ id, published, published_at }) => {
          const { body: _body, ...post } = published!; // the list never shows the body
          return { id, ...post, publishedAt: published_at };
        })}
      />
    </SiteShell>
  );
}
