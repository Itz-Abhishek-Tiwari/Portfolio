import { z } from 'zod';
import { isAdmin, sameOrigin } from '@/lib/server/auth';
import { dataRequest, query } from '@/lib/server/db';
import type { ContactMessage } from '@/lib/contact';
export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: 'Administrator access required' }, { status: 403 });
  try {
    const url = new URL(request.url),
      params: Record<string, string> = { select: '*', order: 'created_at.desc,id.desc', limit: '50' };
    const before = url.searchParams.get('before'),
      id = url.searchParams.get('beforeId');
    if (before || id) {
      const cursor = z
        .object({ before: z.string().datetime({ offset: true }), id: z.string().uuid() })
        .parse({ before, id });
      params.or =
        '(created_at.lt.' +
        cursor.before +
        ',and(created_at.eq.' +
        cursor.before +
        ',id.lt.' +
        cursor.id +
        '))';
    }
    const messages = await dataRequest<ContactMessage[]>('portfolio_contact_messages?' + query(params)),
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
    const rows = await dataRequest<ContactMessage[]>(
      'portfolio_contact_messages?' + query({ id: 'eq.' + body.id }),
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ status: body.status })
      }
    );
    if (!rows[0]) return Response.json({ error: 'Message not found.' }, { status: 404 });
    return Response.json({ message: rows[0] });
  } catch {
    return Response.json({ error: 'The message status could not be changed.' }, { status: 400 });
  }
}
