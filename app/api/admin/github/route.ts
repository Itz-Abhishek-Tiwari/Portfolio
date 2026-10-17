import { isAdmin } from '@/lib/server/auth';
import { githubLogin, loadGithub } from '@/lib/server/github';
import { readContent } from '@/lib/server/content-store';
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const url = new URL(request.url),
      profile = url.searchParams.get('profile') || (await readContent(true)).content.github;
    return Response.json(await loadGithub(githubLogin(profile)), {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'GitHub is unavailable' },
      { status: 503 }
    );
  }
}
