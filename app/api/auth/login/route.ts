import {
  SESSION_COOKIE,
  SESSION_SECONDS,
  checkCredentials,
  createSessionToken,
  sameOrigin
} from '@/lib/server/auth';
import { clientIp } from '@/lib/server/env';

// Per-instance throttle: best-effort brake on password guessing.
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const ip = clientIp(request);
  const entry = attempts.get(ip);
  if (entry && entry.count >= MAX_ATTEMPTS && entry.until > Date.now())
    return Response.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!(await checkCredentials(email, password))) {
    const current = entry && entry.until > Date.now() ? entry.count : 0;
    attempts.set(ip, { count: current + 1, until: Date.now() + LOCK_MS });
    await new Promise(resolve => setTimeout(resolve, 600));
    return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }
  attempts.delete(ip);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'content-type': 'application/json',
      'set-cookie': `${SESSION_COOKIE}=${await createSessionToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`
    }
  });
}
