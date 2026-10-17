import { z } from 'zod';
import { dataRequest, query } from './db';
import type { GithubData } from '@/lib/github';
export type { GithubData };
const profileSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  public_repos: z.number()
});
const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  fork: z.boolean(),
  archived: z.boolean()
});
export function githubLogin(url: string) {
  const u = new URL(url);
  if (u.hostname !== 'github.com') throw new Error('Use a github.com profile URL');
  const login = u.pathname.split('/').filter(Boolean)[0];
  if (!login || !/^[a-zA-Z0-9-]{1,39}$/.test(login))
    throw new Error('Use a GitHub username in the profile URL');
  return login;
}
const pending = new Map<string, Promise<GithubData>>();
export async function loadGithub(login: string): Promise<GithubData> {
  const rows = await dataRequest<{ payload: GithubData; fetched_at: number }[]>(
      'portfolio_github_cache?' +
        query({ id: 'eq.' + login.toLowerCase(), select: 'payload,fetched_at', limit: '1' })
    ),
    cached = rows[0];
  if (cached && Date.now() - cached.fetched_at < 600000) return { ...cached.payload, stale: false };
  if (pending.has(login)) return pending.get(login)!;
  const work = (async () => {
    try {
      async function read(path: string) {
        const r = await fetch('https://api.github.com' + path, {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'Abhishek-Portfolio',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          signal: AbortSignal.timeout(7000)
        });
        if (!r.ok)
          throw new Error(
            r.status === 403 || r.status === 429
              ? 'GitHub rate limit reached. Try again later.'
              : 'GitHub is temporarily unavailable'
          );
        return r.json();
      }
      const [profileJson, reposJson] = await Promise.all([
        read('/users/' + login),
        read('/users/' + login + '/repos?per_page=100&sort=pushed')
      ]);
      const profile = profileSchema.parse(profileJson),
        repos = z.array(repositorySchema).parse(reposJson);
      const own = repos.filter(r => !r.fork && !r.archived && r.name.toLowerCase() !== login.toLowerCase());
      const data: GithubData = {
        profile: {
          login: profile.login,
          name: profile.name || profile.login,
          repos: profile.public_repos
        },
        repositories: own
          .filter(r => r.name !== 'life-os')
          .map(r => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            language: r.language || 'Code',
            stars: r.stargazers_count,
            url: 'https://github.com/' + profile.login + '/' + encodeURIComponent(r.name)
          }))
          .sort((a, b) => b.stars - a.stars),
        syncedAt: new Date().toISOString(),
        stale: false
      };
      await dataRequest('portfolio_github_cache?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: login.toLowerCase(), payload: data, fetched_at: Date.now() })
      });
      return data;
    } catch (error) {
      if (cached) return { ...cached.payload, stale: true };
      throw error;
    }
  })();
  pending.set(login, work);
  try {
    return await work;
  } finally {
    pending.delete(login);
  }
}
