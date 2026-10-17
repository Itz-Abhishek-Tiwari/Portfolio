import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatDate } from '@/lib/site';

export type JournalPost = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  publishedAt: string | null;
};

export default function Journal({ posts }: { posts: JournalPost[] }) {
  if (!posts.length) return null;
  return (
    <section id="journal" className="section-wrap" aria-labelledby="journal-heading">
      <div className="section-heading">
        <div className="section-heading-lead">
          <span className="section-kicker">From the journal</span>
          <h2 id="journal-heading">
            Notes &amp; <em>writing</em>
          </h2>
        </div>
        <div className="section-heading-aside">
          <p>Short pieces on mobile engineering and tooling.</p>
        </div>
      </div>
      <div className="journal-list">
        {posts.map(post => (
          <Link key={post.slug} href={'/blog/' + post.slug} className="journal-row">
            <time>{post.publishedAt ? formatDate(post.publishedAt) : ''}</time>
            <div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </div>
            <span className="journal-tag">{post.tags[0] || 'Notes'}</span>
            <ArrowUpRight size={20} />
          </Link>
        ))}
      </div>
      <Link href="/blog" className="text-link journal-all">
        All articles <ArrowUpRight size={14} />
      </Link>
    </section>
  );
}
