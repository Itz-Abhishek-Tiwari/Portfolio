// Shared test setup: the local server URL and a real studio session (credentials from .env.local).
try {
  process.loadEnvFile('.env.local');
} catch {}
export const base = process.env.PORTFOLIO_TEST_URL || 'http://localhost:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base)) throw Error('Run the tests against a local dev server, never production.');
const login = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { Origin: base, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.PORTFOLIO_ADMIN_EMAIL, password: process.env.PORTFOLIO_ADMIN_PASSWORD })
});
if (!login.ok) throw Error('Studio sign-in failed (' + login.status + '). Check PORTFOLIO_ADMIN_* in .env.local.');
export const cookie = login.headers.get('set-cookie').split(';')[0];
