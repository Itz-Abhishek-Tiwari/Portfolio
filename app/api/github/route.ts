import { readContent } from '@/lib/server/content-store';
import { githubLogin, loadGithub } from '@/lib/server/github';
export async function GET() {
  try {
    const { content } = await readContent();
    const data = await loadGithub(githubLogin(content.github));
    // The loader caches GitHub for ten minutes; let browsers reuse a response briefly too.
    return Response.json(data, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'GitHub unavailable' }, { status: 503 });
  }
}
