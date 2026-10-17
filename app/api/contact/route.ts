import { sameOrigin } from '@/lib/server/auth';
import { clientIp, serverEnv } from '@/lib/server/env';
import { contactSchema } from '@/lib/server/contact';
import { dataRequest, DatabaseError } from '@/lib/server/db';
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: 'Send this form from the portfolio page.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json'))
    return Response.json({ error: 'Invalid form format.' }, { status: 415 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: 'The form is empty.' }, { status: 400 });
    let length = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 24000) {
        await reader.cancel();
        return Response.json({ error: 'The message is too large.' }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed = contactSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!parsed.success)
      return Response.json(
        {
          error: 'Check the highlighted fields.',
          issues: parsed.error.issues.map(i => ({ field: String(i.path[0]), message: i.message }))
        },
        { status: 422 }
      );
    if (parsed.data.website) return Response.json({ received: true }, { status: 202 });
    const secret = serverEnv('SUPABASE_SECRET_KEY');
    if (!secret) throw new DatabaseError('Contact storage is unavailable.', 503);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const digest = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(clientIp(request))
    );
    const bucket = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const { name, email, topic, message } = parsed.data;
    await dataRequest('rpc/portfolio_submit_contact', {
      method: 'POST',
      body: JSON.stringify({
        p_name: name,
        p_email: email,
        p_topic: topic,
        p_message: message,
        p_bucket: bucket
      })
    });
    return Response.json({ received: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof DatabaseError && error.status === 429
            ? 'Too many messages. Please try again in an hour.'
            : 'Your message could not be saved. Please try again or use the email link.'
      },
      {
        status:
          error instanceof SyntaxError
            ? 400
            : error instanceof DatabaseError && error.status === 429
              ? 429
              : 503
      }
    );
  }
}
