import { cookies } from 'next/headers';
import { env } from 'cloudflare:workers';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

type AuthEnv = {
  PORTFOLIO_ADMIN_EMAIL?: string;
  PORTFOLIO_ADMIN_PASSWORD?: string;
  PORTFOLIO_SESSION_SECRET?: string;
};
const config = () => env as unknown as AuthEnv;

const encoder = new TextEncoder();
const toHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');

async function sign(payload: string) {
  const { PORTFOLIO_SESSION_SECRET, PORTFOLIO_ADMIN_PASSWORD } = config();
  const secret = PORTFOLIO_SESSION_SECRET || PORTFOLIO_ADMIN_PASSWORD || '';
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

function safeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export function adminEmail() {
  return (config().PORTFOLIO_ADMIN_EMAIL || 'abhitiwariabhi7@gmail.com').trim().toLowerCase();
}

export async function checkCredentials(email: string, password: string) {
  const expected = config().PORTFOLIO_ADMIN_PASSWORD;
  if (!expected) return false;
  // Evaluate both comparisons so timing does not reveal which one failed.
  const emailOk = safeEqual(email.trim().toLowerCase(), adminEmail());
  const passwordOk = safeEqual(password, expected);
  return emailOk && passwordOk;
}

export async function createSessionToken() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${await sign(`${adminEmail()}.${expires}`)}`;
}

export async function isAdmin() {
  if (!config().PORTFOLIO_ADMIN_PASSWORD) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(signature, await sign(`${adminEmail()}.${expires}`));
}

export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
