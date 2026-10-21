import { z } from 'zod';
import { isAdmin, sameOrigin } from '@/lib/server/auth';
import { listPosts, savePost, setPostState } from '@/lib/server/posts-store';
import { postSchema } from '@/lib/posts';
import { DatabaseError } from '@/lib/server/db';
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    return Response.json({ posts: await listPosts(true) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Posts could not be loaded.' }, { status: 503 });
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 180000) return Response.json({ error: 'This post is too large' }, { status: 413 });
    const body = z
      .object({
        id: z.string().uuid(),
        content: postSchema,
        revision: z.number().int().nonnegative(),
        publish: z.boolean()
      })
      .parse(JSON.parse(text));
    return Response.json(await savePost(body.id, body.content, body.revision, body.publish));
  } catch (error) {
    return Response.json(
      {
        error: error instanceof DatabaseError ? error.message : 'Fix the highlighted fields before saving.',
        issues:
          error instanceof z.ZodError
            ? error.issues.map(i => ({ ...i, path: i.path[0] === 'content' ? i.path.slice(1) : i.path }))
            : []
      },
      { status: error instanceof DatabaseError ? error.status : error instanceof z.ZodError ? 422 : 400 }
    );
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const body = z
      .object({
        id: z.string().uuid(),
        revision: z.number().int().positive(),
        action: z.enum(['unpublish', 'archive', 'restore'])
      })
      .parse(await request.json());
    return Response.json(await setPostState(body.id, body.revision, body.action));
  } catch (error) {
    return Response.json(
      { error: error instanceof DatabaseError ? error.message : 'This action failed.' },
      { status: error instanceof DatabaseError ? error.status : 400 }
    );
  }
}
