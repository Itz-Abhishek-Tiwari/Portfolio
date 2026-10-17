'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import type { Post } from '@/lib/posts';
import { formatDate } from '@/lib/site';
export type ListedPost = Omit<Post, 'body'> & { id: string; publishedAt: string | null };

/** The journal page body: search, tag filters and the article list. */
export default function BlogIndex({ posts }: { posts: ListedPost[] }) {
  const [search, setSearch] = useState(''),
    [tag, setTag] = useState('All');
  const tags = [...new Set(posts.flatMap(p => p.tags))],
    filtered = posts.filter(
      p =>
        (tag === 'All' || p.tags.includes(tag)) &&
        (p.title + ' ' + p.excerpt + ' ' + p.tags.join(' ')).toLowerCase().includes(search.toLowerCase())
    );
  return (
    <div className="blog-index section-wrap">
      <header className="detail-heading">
        <span className="section-kicker">The journal</span>
        <h1>
          Things I
          <br />
          <em>wrote down.</em>
        </h1>
        <p>Notes on engineering and experiments.</p>
      </header>
      <div className="blog-toolbar">
        <label className="directory-search">
          <Search size={17} />
          <input
            aria-label="Search articles"
            placeholder="Find an article…"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <div className="filters">
          {['All', ...tags].map(t => (
            <button
              key={t}
              aria-pressed={tag === t}
              className={tag === t ? 'active' : ''}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="blog-list">
        {filtered.map((p, i) => (
          <Link key={p.id} href={'/blog/' + p.slug} className="blog-row">
            <time>{p.publishedAt ? formatDate(p.publishedAt) : ''}</time>
            <div className="blog-row-main">
              <span className="blog-row-no">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{p.title}</h2>
                <p>{p.excerpt}</p>
                <span className="blog-row-tags">{p.tags.join(' · ') || 'Notes'}</span>
              </div>
            </div>
            {p.cover ? (
              <img src={p.cover} alt="" loading="lazy" />
            ) : (
              <span className="blog-row-go">
                <ArrowUpRight size={22} />
              </span>
            )}
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="blog-empty">
          <h2>{posts.length ? 'No matching articles.' : 'No articles yet.'}</h2>
          <p>
            {posts.length ? 'Try another search or topic.' : 'New articles will appear here once published.'}
          </p>
        </div>
      )}
    </div>
  );
}
