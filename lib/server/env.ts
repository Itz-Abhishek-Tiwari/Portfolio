// Server-only configuration: Vercel project settings in production, .env.local in development.
// Never read these from client components, and never prefix them with NEXT_PUBLIC_.
export function serverEnv(name: string) {
  return process.env[name]?.trim() || '';
}

/** Best-effort visitor IP for rate limiting. Vercel sets x-forwarded-for; local dev has none. */
export function clientIp(request: Request) {
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'local-development'
  );
}
