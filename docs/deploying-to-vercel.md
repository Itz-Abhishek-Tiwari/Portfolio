# Deploying to Vercel

The site is a standard Next.js app. It needs two services: **Vercel** for hosting and **Supabase**
for the database and file storage. There is nothing to change in the code, and no `vercel.json`.
Vercel detects Next.js and runs `npm run build`, which regenerates the theme CSS and then runs
`next build`.

## 1. Set up Supabase

1. Create a Supabase project (or two: one for production, one for local development and previews).
2. Copy three values:
   - **Project URL**: Project Settings → Data API, e.g. `https://abcd1234.supabase.co`
   - **Secret key**: Project Settings → API Keys → *Secret keys* (`sb_secret_…`)
   - **Connection string**: **Connect** → *Session pooler* (only for running migrations)
3. Apply the schema from your machine:

   ```sh
   SUPABASE_DB_URL='postgresql://postgres.abcd1234:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres' \
     npm run db:migrate
   ```

   This runs `database/001…004` in order and records each one, so it is safe to run again after
   adding a migration. `004_storage.sql` creates the private `media` bucket for uploads (4 MB limit,
   JPG/PNG/WebP/PDF only). If you'd rather use the dashboard, paste each file into the SQL Editor in order.

## 2. Create the Vercel project

1. Push the repo to GitHub, GitLab or Bitbucket.
2. In Vercel, go to **Add New → Project** and import the repo. Leave every build setting at its default.
3. Under **Settings → Environment Variables**, add:

| Variable | Required | Value |
| --- | --- | --- |
| `SUPABASE_URL` | yes | `https://<project>.supabase.co` |
| `SUPABASE_SECRET_KEY` | yes | The `sb_secret_…` key. Server-only. Also seeds the contact form's IP hash. |
| `PORTFOLIO_ADMIN_EMAIL` | yes | Studio sign-in email |
| `PORTFOLIO_ADMIN_PASSWORD` | yes | Studio sign-in password |
| `PORTFOLIO_SESSION_SECRET` | recommended | `openssl rand -base64 48`. Without it, sessions are signed with the admin password. |
| `PORTFOLIO_YOUTUBE_API_KEY` | optional | Studio → Music search |
| `PORTFOLIO_RAWG_API_KEY` | optional | Studio → Games search |

`SUPABASE_DB_URL` is only for migrations, so it doesn't belong in Vercel. Don't prefix anything
with `NEXT_PUBLIC_`. That would ship it to the browser.

4. Deploy. Every push to `main` deploys to production, and other branches get preview URLs.

**Preview deployments share the production database by default.** Anyone with a preview URL and
the admin password can edit live content. Either scope the Supabase variables to *Production*,
or point *Preview* at your development project.

### Custom domain

Go to **Settings → Domains**, add the domain, and set the DNS records Vercel shows. The session
cookie is marked `Secure` automatically over HTTPS. The same-origin checks compare the `Origin`
header with the request's own origin, so they work on any domain without configuration.

## Moving existing content from the old local database

If you have content in the old local Postgres database (`port_abhishek_dev`, from the removed
`npm run db:setup`), copy it into Supabase after running the migrations:

```sh
pg_dump "postgresql:///port_abhishek_dev?host=/tmp" --data-only \
  --table='public.portfolio_*' --exclude-table=public.portfolio_schema_migrations \
  | psql "$SUPABASE_DB_URL"
```

Uploaded files aren't in that database. Content that points at `/api/media/<key>` shows broken
images until you upload those files again in the studio.

## After the first deploy

- [ ] `/` and `/blog` show your published content, not the defaults
- [ ] `/admin` signs in, saves a draft, and **Publish** updates the live page
- [ ] Uploading an image in the studio works, and the image loads from `/api/media/…`
- [ ] The résumé preview and download work
- [ ] The contact form submits, and the message appears in Studio → Inbox
- [ ] Function logs (Vercel → Deployment → Logs) show no `Supabase is not configured` errors

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Pages 500, logs say `Supabase is not configured` | `SUPABASE_URL` or `SUPABASE_SECRET_KEY` missing for this environment (Production vs Preview). Redeploy after adding them. |
| `The database request failed` | Publishable key used instead of the secret key, or migrations not applied |
| Uploads fail with "Upload failed" | `004_storage.sql` not applied, so the `media` bucket is missing |
| Upload says "Choose a file under 4 MB" | Vercel caps request bodies at 4.5 MB. Compress the PDF. Photos are re-encoded automatically. |
| `/api/media/…` returns 503 | Supabase variables missing |
| Saves return 403 | The request's `Origin` doesn't match the deployment URL, e.g. signed in on a preview URL and saving on the custom domain |
| Everyone signed out of the studio | `PORTFOLIO_SESSION_SECRET` (or, without it, the admin password) changed. Expected, so sign in again. |
| `db:migrate` fails with a TLS or connection error | Use the *Session pooler* string from **Connect**. The direct connection is IPv6-only on some networks. |

## Local development

```sh
cp .env.example .env.local   # same variables as Vercel, plus SUPABASE_DB_URL
npm run dev                  # http://localhost:3000
```

Point `.env.local` at your development Supabase project. The integration tests in `tests/` write
drafts and contact fixtures to whichever project it names.
