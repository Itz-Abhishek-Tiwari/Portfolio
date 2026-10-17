import { serverEnv } from '@/lib/server/env';

// Supabase is reached over plain HTTP (PostgREST for data, Storage for uploads), so no SDK is needed.
export function supabaseConfig() {
  const url = serverEnv('SUPABASE_URL').replace(/\/$/, ''),
    key = serverEnv('SUPABASE_SECRET_KEY');
  return url && key ? { url, key } : null;
}

/** Server-role headers. New sb_secret_ keys go in apikey only; legacy service_role JWTs also need Bearer. */
export function supabaseHeaders(key: string, init?: HeadersInit) {
  const headers = new Headers(init);
  headers.set('apikey', key);
  if (!key.startsWith('sb_secret_')) headers.set('Authorization', 'Bearer ' + key);
  return headers;
}
