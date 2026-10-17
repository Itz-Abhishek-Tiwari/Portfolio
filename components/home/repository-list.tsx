'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import type { GithubData } from '@/lib/github';

const PREVIEW_COUNT = 4;
// GitHub's linguist colours for the languages that appear here.
const languageColors: Record<string, string> = {
  JavaScript: '#f1da61',
  TypeScript: '#6b9cdd',
  Python: '#88adcf',
  Shell: '#a5c777',
  CSS: '#b893df',
  HTML: '#e49368',
  Lua: '#909aca'
};

async function fetchRepositories(github: string, preview: boolean, signal: AbortSignal) {
  const response = await fetch(
    preview ? '/api/admin/github?profile=' + encodeURIComponent(github) : '/api/github',
    { signal }
  );
  const body = (await response.json()) as GithubData & { error?: string };
  if (!response.ok) throw new Error(body.error || 'Unable to load GitHub');
  return body;
}

export default function RepositoryList({ github, preview }: { github: string; preview: boolean }) {
  const [data, setData] = useState<GithubData | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [showAll, setShowAll] = useState(false),
    [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    fetchRepositories(github, preview, abort.signal)
      .then(
        setData,
        e => !abort.signal.aborted && setError(e instanceof Error ? e.message : 'GitHub unavailable')
      )
      .finally(() => !abort.signal.aborted && setBusy(false));
    return () => abort.abort();
  }, [github, preview, attempt]);

  const retry = useCallback(() => {
    setBusy(true);
    setError('');
    setAttempt(n => n + 1);
  }, []);

  const repositories = data?.repositories ?? [];
  const visible = showAll ? repositories : repositories.slice(0, PREVIEW_COUNT);
  return (
    <div className="directory-main">
      <div className="repository-directory">
        {visible.map((repo, i) => (
          <a key={repo.id} className="repo-row" href={repo.url} target="_blank" rel="noreferrer">
            <span className="repo-number">{String(i + 1).padStart(2, '0')}</span>
            <div className="repo-row-body">
              <div className="repo-row-meta">
                <span>
                  <i style={{ background: languageColors[repo.language] || '#8b947a' }} />
                  {repo.language}
                </span>
                <span>
                  <Star size={12} />
                  {repo.stars}
                </span>
              </div>
              <h3>{repo.name}</h3>
              <p>{repo.description || 'Source, experiments, and project files.'}</p>
            </div>
            <span className="repo-arrow">
              <ArrowUpRight size={27} />
            </span>
          </a>
        ))}
      </div>
      {data && !repositories.length && <p className="directory-message">No public repositories yet.</p>}
      {repositories.length > PREVIEW_COUNT && (
        <button className="directory-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer repositories' : 'Explore all ' + repositories.length + ' repositories'}
          <ArrowRight size={17} />
        </button>
      )}
      {busy && !data && (
        <div className="directory-loading" role="status">
          <p>Loading repositories…</p>
        </div>
      )}
      {error && (
        <p className="directory-message" role="alert">
          {error} <button onClick={retry}>Try again ↗</button>
        </p>
      )}
      {data?.stale && (
        <p className="directory-message">GitHub is unavailable. Showing the last successful sync.</p>
      )}
    </div>
  );
}
