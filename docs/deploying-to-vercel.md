# Deploying to Vercel

This site runs on **vinext** (Next.js on Vite), and vinext deploys to Cloudflare Workers or plain
Node. It has no Vercel adapter. Vercel builds Next.js apps with `next build`, and this codebase is
standard App Router code, so the path is to build it with Next.js itself. `next` 16.3.4 is already
a dependency.

Tested on 2026-10-17: with change 1 below applied, `next build` compiles, type-checks and emits
all 22 routes. `next start` serves `/`, `/blog`, `/admin`, `/api/content` and `/api/posts` from
the database. Only `/api/media/*` fails (503) until change 2 is in place.

> **Just want it live?** Cloudflare is already supported with no code changes:
> `npx @vinext/cloudflare deploy`. Use this guide only if you want Vercel specifically.

## What has to change

Three things in the code depend on Cloudflare Workers:

| Dependency | Where | Fix |
| --- | --- | --- |
| `import { env } from 'cloudflare:workers'` | 7 files | Read `process.env` through one helper |
| R2 bucket binding (`env.BUCKET`) | `app/api/admin/upload/route.ts`, `app/api/media/[key]/route.ts` | Talk to R2 over its S3 API |
| `cf-connecting-ip` header | `app/api/contact/route.ts` | Fall back to Vercel's `x-forwarded-for` |

The database is already reached over HTTP (PostgREST/Supabase), so it works on Vercel unchanged.

### 1. Environment helper

Create `lib/server/env.ts`:

```ts
// Server-only configuration. On Vercel this is process.env; on Cloudflare Workers with
// nodejs_compat (compatibility date 2026-05-15) vars and secrets are populated there too.
export const env = process.env as Record<string, string | undefined>;
```

Then, in each of these files, replace `import { env } from 'cloudflare:workers';` with
`import { env } from '@/lib/server/env';`:

- `lib/server/db.ts`
- `lib/server/auth.ts`
- `lib/server/youtube.ts`
- `app/api/contact/route.ts`
- `app/api/admin/games/search/route.ts`
- `app/api/admin/upload/route.ts` (also needs change 2)
- `app/api/media/[key]/route.ts` (also needs change 2)

```sh
grep -rl "from 'cloudflare:workers'" app lib   # should print nothing when you're done
```

### 2. File storage (uploads and résumé)

Keep the existing R2 bucket and reach it over its S3-compatible API. Files already uploaded keep
working, and their `/api/media/<key>` URLs don't change.

```sh
npm install @aws-sdk/client-s3
```

Create `lib/server/storage.ts`:

```ts
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/server/env';

const bucket = env.R2_BUCKET;
const client =
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }
      })
    : null;

export const storageReady = () => Boolean(client && bucket);

export async function putFile(key: string, body: Uint8Array, contentType: string) {
  await client!.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

export async function getFile(key: string) {
  try {
    const res = await client!.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return { body: res.Body!.transformToWebStream(), contentType: res.ContentType };
  } catch (error) {
    if ((error as { name?: string }).name === 'NoSuchKey') return null;
    throw error;
  }
}
```

In `app/api/admin/upload/route.ts`:

```ts
// before
if (!env.BUCKET) …
await env.BUCKET.put(key, buffer, { httpMetadata: { contentType: detected } });
// after
if (!storageReady()) …
await putFile(key, new Uint8Array(buffer), detected);
```

In `app/api/media/[key]/route.ts`:

```ts
// before
if (!env.BUCKET) return new Response('Storage unavailable', { status: 503 });
const file = await env.BUCKET.get(key);
if (!file) return new Response('Not found', { status: 404 });
const headers = new Headers();
file.writeHttpMetadata(headers);
// after
if (!storageReady()) return new Response('Storage unavailable', { status: 503 });
const file = await getFile(key);
if (!file) return new Response('Not found', { status: 404 });
const headers = new Headers();
if (file.contentType) headers.set('Content-Type', file.contentType);
```

The rest of the media route (cache headers, `?download=` / `?name=`) stays the same. The route
returns `file.body`, which is still a web stream.

To create the credentials: Cloudflare dashboard → R2 → **Manage API tokens** → create a token with
*Object Read & Write* on the bucket. The account ID is shown on the R2 overview page.

**Alternative:** Vercel Blob (`@vercel/blob`) avoids Cloudflare entirely, but you would have to
copy the existing files across and rewrite the stored `/api/media/...` URLs in your content.

### 3. Contact form rate limiting

The contact route hashes the visitor's IP to rate-limit submissions. It reads `cf-connecting-ip`,
which only Cloudflare sends. Without a fix, every Vercel visitor shares one rate-limit bucket, so
after five messages in an hour, from anyone, the form is blocked for everyone. In `app/api/contact/route.ts`:

```ts
// before
request.headers.get('cf-connecting-ip') || 'local-development'
// after
request.headers.get('cf-connecting-ip') ||
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
  'local-development'
```

### 4. Build command

`npm run build` runs vinext, so tell Vercel to use Next.js. Add `vercel.json` at the repo root:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run themes:generate && next build"
}
```

`themes:generate` uses `node --experimental-strip-types`, which needs Node 22.6 or newer.
`package.json` already requires `>=22.13.0`.

### Check it locally first

```sh
npm run themes:generate && npx next build
PORTFOLIO_DATABASE_API_URL=… PORTFOLIO_DATABASE_API_KEY=… npx next start
```

Next.js can rewrite `tsconfig.json` on its first build. Review that diff before committing it.

## Set up production services

### Database (Supabase)

1. Create a Supabase project.
2. Run `database/001_initial.sql`, `002_published_slugs.sql` and `003_contact.sql` **in order**
   (SQL Editor, or `psql "$SUPABASE_DB_URL" -f database/001_initial.sql` and so on).
3. Copy the project URL and the **secret** key (`sb_secret_…`) from Project Settings → API Keys.
   `lib/server/db.ts` already recognizes `sb_secret_` keys.

### Storage (R2)

Use the existing `BUCKET` bucket from the Cloudflare deployment, or create a new one, then create
an API token as described in change 2.

## Create the Vercel project

1. Push the repo to GitHub, GitLab or Bitbucket.
2. In Vercel, go to **Add New → Project**, import the repo, and leave the root directory as `/`.
   `vercel.json` sets the framework and build command.
3. Under **Settings → Environment Variables**, add the variables below.
4. Deploy. Every push to `main` deploys to production. Other branches get preview URLs.

| Variable | Required | Value |
| --- | --- | --- |
| `PORTFOLIO_DATABASE_API_URL` | yes | `https://<project>.supabase.co/rest/v1` |
| `PORTFOLIO_DATABASE_API_KEY` | yes | Supabase secret key. Server-only. Also seeds the contact IP hash. |
| `PORTFOLIO_ADMIN_EMAIL` | yes | Studio sign-in email |
| `PORTFOLIO_ADMIN_PASSWORD` | yes | Studio sign-in password |
| `PORTFOLIO_SESSION_SECRET` | recommended | Long random string, e.g. `openssl rand -base64 48`. Without it, sessions are signed with the admin password. |
| `R2_ACCOUNT_ID` | for uploads | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | for uploads | R2 token access key |
| `R2_SECRET_ACCESS_KEY` | for uploads | R2 token secret |
| `R2_BUCKET` | for uploads | Bucket name |
| `PORTFOLIO_YOUTUBE_API_KEY` | optional | Studio → Music search |
| `PORTFOLIO_RAWG_API_KEY` | optional | Studio → Games search |

Don't prefix any of these with `NEXT_PUBLIC_`. That would ship them to the browser.

**Preview deployments share the production database by default.** Anyone with a preview URL and
the admin password can edit live content. Either scope the database variables to *Production*
only, or point *Preview* at a separate Supabase project.

### Custom domain

Go to **Settings → Domains**, add the domain, and set the DNS records Vercel shows. The admin
session cookie is set with `Secure` automatically over HTTPS. The same-origin checks compare the
`Origin` header with the request URL's origin, so they work on any domain without configuration.

## After the first deploy

- [ ] `/` and `/blog` render your published content (not the defaults)
- [ ] `/admin` signs in, saves a draft, and **Publish** updates the live page
- [ ] Uploading an image in the studio works, and the image loads from `/api/media/…`
- [ ] The résumé preview and download work
- [ ] The contact form submits, and the message appears in Studio → Inbox
- [ ] Function logs (Vercel → Deployment → Logs) show no `PostgreSQL is not configured` errors

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Build fails with `Cannot find module 'cloudflare:workers'` | Change 1 missed a file. Run the `grep` above. |
| Build runs `vinext build` | `vercel.json` is missing, or the Build Command is overridden in project settings |
| Pages 500, logs say `PostgreSQL is not configured` | Database variables missing for this environment (Production vs Preview) |
| `The database request failed` | Wrong key (publishable instead of secret), or migrations not applied |
| `/api/media/…` returns 503 | R2 variables missing |
| Contact form says "Too many messages" for everyone | Change 3 not applied |
| Saves return 403 | The request's `Origin` doesn't match the deployment URL, e.g. you signed in on a preview URL and are saving on the custom domain |
| Everyone signed out of the studio | `PORTFOLIO_SESSION_SECRET` (or, without it, the admin password) changed. Expected, so sign in again. |

## Local development after the move

`npm run dev` (vinext) keeps working for pages and the database. It reads
`.sites-runtime/database.json` from `npm run db:setup`. Uploads in local dev will need the same
`R2_*` variables in `.dev.vars`, because the storage helper no longer uses the Workers binding. To
match production exactly, run `npx next dev` with the database URL and key in `.env.local`.
