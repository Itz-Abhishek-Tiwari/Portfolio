# Deploying to Vercel

The site is a standard Next.js app, and **Vercel** is the only service it needs. Content, journal
posts, the contact inbox and uploads all live in a private **Vercel Blob** store. There is no
database and no schema to apply. There is also nothing to change in the code, and no `vercel.json`.
Vercel detects Next.js and runs `npm run build`, which regenerates the theme CSS and then runs
`next build`.

## 1. Create the Vercel project

1. Push the repo to GitHub, GitLab or Bitbucket.
2. In Vercel, go to **Add New → Project** and import the repo. Leave every build setting at its default.

## 2. Connect a Blob store

1. In the project, open **Storage → Create → Blob**. Choose **Private** access and connect it to
   the project for all environments. With the CLI: `vercel blob create-store portfolio --access private`.
2. Connecting the store adds `BLOB_STORE_ID`, and functions authenticate with short-lived OIDC
   tokens. You don't have to copy a token into the Vercel settings.

The first studio save creates each document. Until then the site shows the defaults from
`lib/content.ts`.

## 3. Add the environment variables

Under **Settings → Environment Variables**, add:

| Variable | Required | Value |
| --- | --- | --- |
| `PORTFOLIO_ADMIN_EMAIL` | yes | Studio sign-in email |
| `PORTFOLIO_ADMIN_PASSWORD` | yes | Studio sign-in password |
| `PORTFOLIO_SESSION_SECRET` | recommended | `openssl rand -base64 48`. Signs sessions and keys the contact form's IP hash. Without it, the admin password is used. |
| `PORTFOLIO_YOUTUBE_API_KEY` | optional | Studio → Music search |
| `PORTFOLIO_RAWG_API_KEY` | optional | Studio → Games search |

Don't prefix anything with `NEXT_PUBLIC_`. That would ship it to the browser.

Deploy. Every push to `main` deploys to production, and other branches get preview URLs.

**Preview deployments share the production store if it is connected to every environment.** Anyone
with a preview URL and the admin password can then edit live content. To prevent that, connect the
store to *Production* only, and connect a second store to *Preview* and *Development*.

### Custom domain

Go to **Settings → Domains**, add the domain, and set the DNS records Vercel shows. The session
cookie is marked `Secure` automatically over HTTPS. The same-origin checks compare the `Origin`
header with the request's own origin, so they work on any domain without configuration.

## After the first deploy

- [ ] `/admin` signs in, saves a draft, and **Publish** updates the live page (within about a minute)
- [ ] `/` and `/blog` show your published content, not the defaults
- [ ] Uploading an image in the studio works, and the image loads from `/api/media/…`
- [ ] The résumé preview and download work
- [ ] The contact form submits, and the message appears in Studio → Inbox
- [ ] Function logs (Vercel → Deployment → Logs) show no `Vercel Blob is not configured` errors

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Pages 500, logs say `Vercel Blob is not configured` | No Blob store is connected for this environment (Production vs Preview). Connect it, then redeploy. |
| A publish doesn't show on the live site right away | Public pages read through the Blob CDN cache for up to 60 seconds. The studio and `/admin/preview` always read fresh. |
| `A newer draft exists` or `changed in another session` | Another tab or session saved first. Reload, then save again. |
| Upload says "Choose a file under 4 MB" | Vercel caps request bodies at 4.5 MB. Compress the PDF. Photos are re-encoded automatically. |
| `/api/media/…` returns 503 | No Blob store connected |
| Saves return 403 | The request's `Origin` doesn't match the deployment URL, e.g. signed in on a preview URL and saving on the custom domain |
| Everyone signed out of the studio | `PORTFOLIO_SESSION_SECRET` (or, without it, the admin password) changed. Expected, so sign in again. |

## Local development

```sh
cp .env.example .env.local   # studio sign-in, plus BLOB_READ_WRITE_TOKEN for a development store
npm run dev                  # http://localhost:3000
```

Get the token from the store's page in the Vercel dashboard, or run `vercel env pull .env.local`
with the CLI, which writes `BLOB_STORE_ID` and an OIDC token that lasts 12 hours. Point local
development at a development store. The integration tests in `tests/` write drafts and contact
fixtures to whichever store it names.
