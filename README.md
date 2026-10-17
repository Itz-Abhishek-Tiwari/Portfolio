# Abhishek Tiwari: portfolio and journal

Personal portfolio with a journal and an admin studio. Next.js API routes on Vinext, deployed to Cloudflare Workers, with content stored in PostgreSQL (Supabase in production) and uploads in R2.

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
lib/server/           Server-only code (database, auth, content and post stores, GitHub)
styles/               tokens.css → themes.css → base.css → site.css; studio.css loads only under /admin
```

Pages are server components. Only interactive pieces (`'use client'`) hydrate, and they receive the
small `SiteInfo` slice of content rather than the whole document.

## Run it locally

```sh
npm install
npm run db:setup   # prepares the local port_abhishek_dev database and starts PostgREST on 127.0.0.1:54380
npm run dev
```

Private local config is written to the ignored `.sites-runtime` folder.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Regenerates `styles/themes.css`, then builds |
| `npm run lint` | ESLint |
| `npm run themes:generate` | Writes `styles/themes.css` from the palettes in `lib/theme.ts` |
| `npm run db:setup` | Applies `database/*.sql` to the local database |

## Production database

Apply `database/*.sql` in order to your Supabase database, then set two server-only variables:

- `PORTFOLIO_DATABASE_API_URL`: `https://YOUR_PROJECT.supabase.co/rest/v1`
- `PORTFOLIO_DATABASE_API_KEY`: the Supabase secret key. Never expose it to browser code.

The SQL enables row-level security and grants RPC access to the service role only.

## Deploying

- **Cloudflare Workers** (supported as-is): `npx @vinext/cloudflare deploy`
- **Vercel**: needs a few small code changes first. See [docs/deploying-to-vercel.md](docs/deploying-to-vercel.md).

## Admin studio

`/admin` edits the profile, skills, projects, experience, journal posts, theme, music and contact inbox. Changes save as a draft first and go live on Publish. `/admin/preview` shows the saved draft. Saves carry a revision number, so a stale session cannot overwrite newer changes.

Admin access uses email and password sign-in at `/admin`. Set `PORTFOLIO_ADMIN_EMAIL`, `PORTFOLIO_ADMIN_PASSWORD` and (recommended) `PORTFOLIO_SESSION_SECRET`. Every write checks authorization and same-origin on the server.

Uploads (JPG, PNG, WebP, PDF) go to R2 with size and file-signature checks.

## Themes

Seven themes, each with a light and dark palette: Nightfall, Afterglow, Evergreen, Indigo Dusk, Lotus Bloom, Sandstone and Ocean Air. `lib/theme.ts` is the source of truth. After editing a palette, run `npm run themes:generate`. The build does this too.

## Smooth scroll

`hooks/use-smooth-scroll.ts` runs Locomotive Scroll (Lenis) and feeds scroll position to GSAP ScrollTrigger. It is off for reduced-motion visitors and in the admin draft preview.

## Contact form

Messages are validated on both sides and stored in PostgreSQL. The form has a honeypot field, a request size limit, a same-origin check and rate limiting. The inbox in the studio marks messages read or archived. No email is sent automatically.

## Music

The playlist is set under Studio → Music. The player uses the YouTube IFrame API with an offscreen embed and does not extract audio. YouTube's developer policies don't support this, so it may stop working. Use a licensed audio source for a production player.

## Tests

Run these against a local dev server:

```sh
PORTFOLIO_TEST_URL=http://127.0.0.1:5173 python3 tests/smoke.py
python3 tests/admin_regressions.py
python3 tests/blog_regressions.py
node tests/contact_regressions.mjs
node tests/theme_regressions.mjs
```

They only touch the local database. The admin and contact tests restore or remove their own fixtures.

## Assets

`public/assets/nami-desktop.png` is a screenshot from the NamiConfig repository (`screenshots/dark/dark1.png`, branch `namiConfig2.0`). The cover art for Wasalt and My Ticket Partner is conceptual, not a screenshot of the production apps.
