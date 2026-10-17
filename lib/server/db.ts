import { env } from 'cloudflare:workers';
export class DatabaseError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function dataRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const values = env as unknown as Record<string, string>,
    base = values.PORTFOLIO_DATABASE_API_URL,
    key = values.PORTFOLIO_DATABASE_API_KEY;
  if (!base || !key)
    throw new DatabaseError(
      'PostgreSQL is not configured. Run npm run db:setup for local development, or configure the Supabase server URL and secret key.',
      503
    );
  const headers = new Headers(init?.headers);
  headers.set('apikey', key);
  if (!key.startsWith('sb_secret_')) headers.set('Authorization', 'Bearer ' + key);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(base.replace(/\/$/, '') + '/' + path, {
    ...init,
    headers,
    signal: AbortSignal.timeout(12000)
  });
  const text = await response.text();
  let result: unknown;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new DatabaseError('The database returned an unexpected response.', 503);
  }
  if (!response.ok) {
    const detail = result as { message?: string };
    throw new DatabaseError(
      response.status === 409
        ? detail.message || 'This record changed. Reload and try again.'
        : 'The database request failed. Please try again.',
      response.status
    );
  }
  return result as T;
}
export function query(values: Record<string, string>) {
  return new URLSearchParams(values).toString();
}
