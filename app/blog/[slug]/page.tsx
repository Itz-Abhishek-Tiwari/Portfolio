import { notFound } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { publishedPost, draftPost } from '@/lib/server/posts-store';
import { readContent } from '@/lib/server/content-store';
import { isAdmin } from '@/lib/server/auth';
import SiteShell from '@/components/site/site-shell';
import { siteInfo, formatDate } from '@/lib/site';
import Markdown from '@/components/ui/markdown';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = (await publishedPost(slug))?.published;
  if (!post) return {};
  return {
    title: `${post.title} — Abhishek Tiwari`,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      ...(post.cover ? { images: [post.cover] } : {})
    },
    twitter: { card: 'summary_large_image' }
  };
}
export default async function Article({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params,
    { preview } = await searchParams;
  const draft = !!preview && (await isAdmin());
  const row =
    draft && /^[a-f0-9-]{36}$/.test(preview!) ? await draftPost(preview!) : await publishedPost(slug);
  if (!row) notFound();
  const post = draft ? row.draft : row.published;
  if (!post) notFound();
  const { content } = await readContent();
  return (
    <SiteShell site={siteInfo(content)} draft={draft}>
      <div className="article-page section-wrap">
        <Link className="back-link" href="/blog">
          <ArrowLeft size={16} />
          Back to journal
        </Link>
        {draft && <span className="draft-badge">PRIVATE SAVED DRAFT</span>}
        <header className="detail-heading">
          <span className="section-kicker">{post.tags.join(' / ') || 'JOURNAL'}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="article-byline">
            <span>{content.name}</span>
            {row.published_at && <time>{formatDate(row.published_at)}</time>}
            <span>{Math.max(1, Math.ceil(post.body.split(/\s+/).length / 220))} min read</span>
          </div>
        </header>
        {post.cover && <img className="article-cover" src={post.cover} alt="" />}
        <article className="article-body">
          <Markdown body={post.body} />
        </article>
        {!draft && (
          <a
            className="outline-button"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              `${(await headers()).get('x-forwarded-proto') ?? 'https'}://${(await headers()).get('host')}/blog/${slug}`
            )}`}
          >
            Share on LinkedIn <ExternalLink size={16} />
          </a>
        )}
      </div>
    </SiteShell>
  );
}
