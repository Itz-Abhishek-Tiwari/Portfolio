# Abhishek Tiwari: portfolio and journal

Personal portfolio with a journal and an admin studio. Next.js App Router on **Vercel**, with content, the contact inbox and uploads all kept in a private **Vercel Blob** store. Vercel is the only service it needs: there is no database.

## Project structure

```
app/                  Routes only: pages, layouts and API handlers
components/
  site/               Chrome shared by every public page (shell, header, footer, light/dark mode)
  home/               Home page sections; portfolio.tsx composes them
  blog/               Journal index
  music/              Listening corner (widget, lazily loaded player, YouTube API loader)
  ui/                 Small shared pieces (icons, markdown, select, project artwork)
  studio/             Admin studio; panels/ holds one module per tab
hooks/                Client hooks (motion, smooth scroll, reduced motion)
lib/                  Code shared by server and browser (schemas, themes, music links)
lib/server/           Server-only code (Blob data store, auth, content and post stores, GitHub)
styles/               tokens.css → themes.css → base.css → site.css; studio.css loads only under /admin
```

Pages are server components. Only interactive pieces (`'use client'`) hydrate, and they receive the
small `SiteInfo` slice of content rather than the whole document.

## Run it locally

```sh
npm install
cp .env.example .env.local   # fill in a Blob read-write token and the studio sign-in
npm run dev                  # http://localhost:3000
```

Local development talks to a real Blob store. Create a separate private store for development, so
the tests and draft edits never touch the live site. There is no schema to apply: each document is
created on its first save, and until then the site shows the defaults from `lib/content.ts`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (`next dev`) |
| `npm run build` | Regenerates `styles/themes.css`, then runs `next build` |
| `npm start` | Serves the production build |
| `npm run lint` | ESLint |
| `npm run themes:generate` | Writes `styles/themes.css` from the palettes in `lib/theme.ts` |

## Data storage

Everything lives as JSON in one private Vercel Blob store (`lib/server/db.ts`):

| Path | Holds |
| --- | --- |
| `data/content.json` | Site content: draft, published version and revision |
| `data/posts.json` | Every journal post with its draft, published version and revision |
| `data/inbox.json` | Contact messages and the per-visitor rate-limit counters |
| `data/github/<login>.json` | Ten-minute cache of the GitHub profile and repos |
| `media/<uuid>.<ext>` | Studio uploads, served through `/api/media/<key>` |

Every write is conditional on the ETag read just before it, so two saves can't overwrite each other.
The loser gets a 409, and the contact form retries on its own. Reads skip the Blob CDN cache, so a
publish shows on the next page load.

## Deploying

Import the repo into Vercel and add the environment variables. No code changes or `vercel.json`
are needed. See [docs/deploying-to-vercel.md](docs/deploying-to-vercel.md).

## Admin studio

`/admin` edits the profile, skills, projects, experience, journal posts, theme, music and contact inbox. Changes save as a draft first and go live on Publish. `/admin/preview` shows the saved draft. Saves carry a revision number, so a stale session cannot overwrite newer changes.

Admin access uses email and password sign-in at `/admin`. Set `PORTFOLIO_ADMIN_EMAIL`, `PORTFOLIO_ADMIN_PASSWORD` and (recommended) `PORTFOLIO_SESSION_SECRET`. Every write checks authorization and same-origin on the server.

Uploads (JPG, PNG, WebP, PDF, up to 4 MB) go to Vercel Blob with size and file-signature checks. Vercel caps function request bodies at 4.5 MB, and the studio re-encodes large photos in the browser before uploading.

## Themes

Seven themes, each with a light and dark palette: Nightfall, Afterglow, Evergreen, Indigo Dusk, Lotus Bloom, Sandstone and Ocean Air. `lib/theme.ts` is the source of truth. After editing a palette, run `npm run themes:generate`. The build does this too.

## Smooth scroll

`hooks/use-smooth-scroll.ts` runs Locomotive Scroll (Lenis) and feeds scroll position to GSAP ScrollTrigger. It is off for reduced-motion visitors and in the admin draft preview.

## Contact form

Messages are validated on both sides and stored in Vercel Blob. The form has a honeypot field, a request size limit, a same-origin check and rate limiting. The inbox in the studio marks messages read or archived. No email is sent automatically.

## Music

The playlist is set under Studio → Music. The player uses the YouTube IFrame API with an offscreen embed and does not extract audio. YouTube's developer policies don't support this, so it may stop working. Use a licensed audio source for a production player.

## Tests

Run these against `npm run dev`. They sign in with the `PORTFOLIO_ADMIN_*` values from `.env.local`,
and the contact test also needs `BLOB_READ_WRITE_TOKEN`:

```sh
python3 tests/smoke.py
python3 tests/admin_regressions.py
python3 tests/blog_regressions.py
node tests/contact_regressions.mjs
node tests/theme_regressions.mjs
```

They refuse to run against anything but localhost. The admin and contact tests restore or remove their own fixtures, but they still write to whichever Blob store `.env.local` points at, so use a development store.

## Assets

`public/assets/nami-desktop.png` is a screenshot from the NamiConfig repository (`screenshots/dark/dark1.png`, branch `namiConfig2.0`). The cover art for Wasalt and My Ticket Partner is conceptual, not a screenshot of the production apps.
