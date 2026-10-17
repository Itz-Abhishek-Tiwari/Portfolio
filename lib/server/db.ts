import { supabaseConfig, supabaseHeaders } from '@/lib/server/supabase';
export class DatabaseError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function dataRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = supabaseConfig();
  if (!config)
    throw new DatabaseError('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.', 503);
  const headers = supabaseHeaders(config.key, init?.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(config.url + '/rest/v1/' + path, {
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
