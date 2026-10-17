import { z } from 'zod';
import { isAdmin, sameOrigin } from '@/lib/server/auth';
import { readDraftAndPublished, saveContent } from '@/lib/server/content-store';
import { contentSchema } from '@/lib/content';
import { DatabaseError } from '@/lib/server/db';
export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const { draft, published } = await readDraftAndPublished();
    return Response.json(
      { ...draft, published: published.content },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Content could not be loaded. Please try again.' }, { status: 503 });
  }
}
export async function PUT(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  let body: z.infer<typeof requestSchema>;
  try {
    const raw = await request.text();
    if (raw.length > 1500000) return Response.json({ error: 'Content is too large' }, { status: 413 });
    body = requestSchema.parse(JSON.parse(raw));
  } catch (error) {
    return Response.json(
      {
        error: 'Please fix the highlighted fields.',
        issues:
          error instanceof z.ZodError
            ? error.issues.map(issue => ({
                ...issue,
                path: issue.path[0] === 'content' ? issue.path.slice(1) : issue.path
              }))
            : []
      },
      { status: 422 }
    );
  }
  try {
    const result = await saveContent(body.content, body.revision, body.publish);
    return Response.json({ ...result, content: body.content, published: body.publish });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof DatabaseError
            ? error.message
            : 'Save failed. Your edits are still here. Try again.'
      },
      { status: error instanceof DatabaseError && error.status === 409 ? 409 : 503 }
    );
  }
}
const requestSchema = z.object({
  content: contentSchema,
  revision: z.number().int().nonnegative(),
  publish: z.boolean()
});
