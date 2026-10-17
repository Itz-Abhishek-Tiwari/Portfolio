// Applies database/*.sql, in order, to the Supabase Postgres database in SUPABASE_DB_URL.
// Each file runs once (tracked in portfolio_schema_migrations) inside its own transaction.
// Usage: npm run db:migrate   (reads .env.local when present)
import { Client } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const raw = process.env.SUPABASE_DB_URL;
if (!raw) {
  console.error(
    'Set SUPABASE_DB_URL to your Supabase connection string (Project → Connect → Session pooler), in .env.local or the shell.'
  );
  process.exit(1);
}
// Supabase requires TLS. node-postgres lets sslmode in the URL override the ssl option, so drop it.
const url = new URL(raw);
url.searchParams.delete('sslmode');
const local = ['localhost', '127.0.0.1'].includes(url.hostname);
const db = new Client({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
try {
  await db.query(
    'create table if not exists public.portfolio_schema_migrations(version text primary key, applied_at timestamptz not null default now())'
  );
  await db.query('alter table public.portfolio_schema_migrations enable row level security');
  const dir = path.join(process.cwd(), 'database');
  for (const file of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) {
    if ((await db.query('select 1 from public.portfolio_schema_migrations where version=$1', [file])).rowCount) {
      console.log('skip    ' + file);
      continue;
    }
    await db.query('begin');
    try {
      await db.query(await readFile(path.join(dir, file), 'utf8'));
      await db.query('insert into public.portfolio_schema_migrations(version) values($1)', [file]);
      await db.query('commit');
      console.log('applied ' + file);
    } catch (error) {
      await db.query('rollback');
      throw new Error(file + ': ' + error.message);
    }
  }
  await db.query("notify pgrst, 'reload schema'");
} finally {
  await db.end();
}
