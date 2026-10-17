import { useEffect, useState } from 'react';
import { ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import type { GithubData } from '@/lib/github';
import { jsonRequest } from '../studio-io';
import type { PanelProps } from '../types';
import { blankProject, MAX_PROJECTS } from './projects';

export default function ConnectionsPanel({
  content,
  update,
  onMessage
}: Omit<PanelProps, 'issues'> & { onMessage: (message: string) => void }) {
  const [connection, setConnection] = useState<GithubData | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    [attempt, setAttempt] = useState(0);

  // Load when the tab opens (and on Refresh); a newer request or leaving the tab cancels the old one.
  useEffect(() => {
    const abort = new AbortController();
    jsonRequest('/api/admin/github?profile=' + encodeURIComponent(content.github), { signal: abort.signal })
      .then(({ response, body }) => {
        if (!response.ok) throw new Error(String(body.error || 'GitHub is unavailable.'));
        setConnection(body as unknown as GithubData);
      })
      .catch(e => !abort.signal.aborted && setError(e instanceof Error ? e.message : 'Sync failed.'))
      .finally(() => !abort.signal.aborted && setBusy(false));
    return () => abort.abort();
    // The profile URL is read when the tab opens or on Refresh, not on every keystroke in Profile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const refresh = () => {
    setBusy(true);
    setError('');
    setConnection(null);
    setAttempt(n => n + 1);
  };

  return (
    <>
      <div className="editor-panel">
        <div className="panel-top">
          <h3>GitHub repositories</h3>
          <button className="outline-button" disabled={busy} onClick={refresh}>
            <RefreshCw size={14} />
            {busy ? 'Loading…' : 'Refresh'}
          </button>
        </div>
        <p className="studio-info">
          Reads the GitHub URL in your current draft. Import a repository, add your contribution, enable
          visibility, and publish when ready.
        </p>
        {error && (
          <p className="studio-status error" role="alert">
            {error}
          </p>
        )}
        {connection && (
          <>
            <p className="studio-info">
              @{connection.profile.login} · {connection.profile.repos} public repositories
            </p>
            <div className="import-repositories">
              {connection.repositories.map(repo => {
                const exists = content.projects.some(p => p.url === repo.url);
                return (
                  <div className="import-repo" key={repo.id}>
                    <div>
                      <b>{repo.name}</b>
                      <span>
                        {repo.language} · {repo.stars} stars
                      </span>
                    </div>
                    <button
                      className="outline-button"
                      disabled={exists || content.projects.length >= MAX_PROJECTS}
                      onClick={() => {
                        update('projects', [
                          ...content.projects,
                          blankProject({
                            title: repo.name,
                            category: repo.language === 'Shell' ? 'Systems' : 'Web',
                            description: (repo.description || 'Explore this project and its source.').slice(
                              0,
                              700
                            ),
                            stack: repo.language,
                            url: repo.url
                          })
                        ]);
                        onMessage(repo.name + ' added to your draft.');
                      }}
                    >
                      {exists ? 'In your draft' : 'Import'}
                      <Plus size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="editor-panel">
        <h3>LinkedIn</h3>
        <p className="studio-info">
          Profile and Experience control the professional information shown on your site. The LinkedIn
          connector supports profile discovery; automatic profile and posts synchronization is unavailable.
        </p>
        <a className="outline-button" href={content.linkedin} target="_blank" rel="noreferrer">
          View LinkedIn <ArrowUpRight size={16} />
        </a>
      </div>
    </>
  );
}
