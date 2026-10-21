import { z } from 'zod';
import { isAdmin, sameOrigin } from '@/lib/server/auth';
import { listMessages, setMessageStatus } from '@/lib/server/contact';
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const url = new URL(request.url),
      before = url.searchParams.get('before'),
      id = url.searchParams.get('beforeId');
    const cursor =
      before || id
        ? z.object({ before: z.string().datetime({ offset: true }), id: z.string().uuid() }).parse({ before, id })
        : undefined;
    const messages = await listMessages(cursor),
      last = messages.at(-1);
    return Response.json(
      {
        messages,
        next: messages.length === 50 && last ? { before: last.created_at, beforeId: last.id } : null
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json({ error: 'Messages could not be loaded.' }, { status: 503 });
  }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin()))
    return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const body = z
      .object({ id: z.string().uuid(), status: z.enum(['new', 'read', 'archived']) })
      .parse(await request.json());
    const message = await setMessageStatus(body.id, body.status);
    if (!message) return Response.json({ error: 'Message not found.' }, { status: 404 });
    return Response.json({ message });
  } catch {
    return Response.json({ error: 'The message status could not be changed.' }, { status: 400 });
  }
}
