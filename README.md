# Abhishek Tiwari — Portfolio & Content Studio

An editorial manga-inspired portfolio built with React, TypeScript, Vinext, Cloudflare D1 and R2.

## Development

```sh
npm install
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clear_mandroid.sql
npm run dev
```

Apply the migration only once per local database. Development sign-in is simulated by the starter on localhost.

## Admin

Visit `/admin`. Hosted writes require ChatGPT sign-in and the administrator email. The default email is `abhitiwariabhi7@gmail.com`, as supplied in the CV. Set `PORTFOLIO_ADMIN_EMAIL` through Sites environment variables if the ChatGPT account uses a different email. Every write checks authorization and same-origin requests server-side.

Profile, links, skills, projects, project stories, project order, visibility, experience, portrait, résumé, complete themes and scene motion are editable. Save draft preserves the live content; Publish promotes the draft. `/admin/preview` displays the saved draft. Revision checks prevent overwriting newer changes from another session.

Content persists in D1. Uploaded JPG, PNG, WebP, and PDF files persist in R2, with size and signature validation. Initial content is supplied from the CV and verified NamiConfig README; app illustrations are conceptual, not screenshots of production apps.

## Hosting

Site identity and bindings are tracked in `.openai/hosting.json`. The first deployment is private for owner review. Site visibility and admin authorization are separate: changing the site audience does not remove server-side admin checks.

## Artwork

`public/assets/rooftop-ink.png` was generated with the built-in ImageGen tool. Prompt: panoramic fine-ink manga rooftop illustration on warm ivory paper, lone figure overlooking city roofs and distant mountains under a vermilion sun; limited ink/ivory/vermilion palette, analog crosshatching, no lettering or watermark. Original is preserved in the Codex generated-images directory.

## Motion and connections

The public page now uses GSAP and ScrollTrigger for staged name reveals, artwork parallax, full-width project chapters with illustration parallax, a moving marquee, section entrances, pointer following, magnetic links, and story-dialog entrances. It respects reduced-motion preferences, keeps full project chapters visible on desktop and mobile, restores hash navigation after layout initialization, and reverts animation contexts on unmount.

`/api/github` reads the profile URL in published content and retrieves public profile data, up to 100 repositories, and recent public events from GitHub's REST API. Responses are cached in the `github_cache` D1 table for ten minutes; an unavailable provider returns the last successful snapshot with an explicit stale flag. Repository search, refresh, and links are available on the public page. Admin Connections can import selected repositories into an unpublished draft, with visibility off until explicitly enabled.

LinkedIn search confirmed the supplied handle against Thoughtwin. The available connector only exposes people search, so the professional panel links to the verified profile and uses studio-managed career information; it does not claim to sync posts or full profile data. Hosted connector eligibility discovery is unavailable in this tool surface, so no workspace connector declaration or visitor connection is included. GitHub uses its public REST API without a token.

The NamiConfig image is an actual repository screenshot from `screenshots/dark/dark1.png` on branch `namiConfig2.0`, saved locally as `public/assets/nami-desktop.png`.

Apply `drizzle/0001_motionless_smiling_tiger.sql` once to an existing local database to add the GitHub cache table. Production migrations run through Sites publication.

Run integration checks against an existing dev preview with:

```sh
PORTFOLIO_TEST_URL=http://127.0.0.1:5173 python3 tests/smoke.py
```

The project section uses complete vertical chapters with tailored property-discovery and task-workflow illustrations, plus the actual NamiConfig screenshot. The connections section uses a searchable repository directory with four initial entries, optional expansion, and a compact LinkedIn row.

## Sunset redesign and studio fixes

The current design uses a shared semantic theme system (`lib/theme.ts` and CSS tokens): Afterglow (default sunset), Nightfall, and Evergreen. The theme covers the portfolio, studio, previews, section surfaces, text, borders, buttons, and SVG artwork. Original photographs and repository screenshots retain their source pixels.

The hero has distinct background, transparent mist, and transparent foreground planes. GSAP gives each plane separate pointer and scroll depth; the pointer layer and scroll layer use nested wrappers to avoid transform conflicts. Motion can be disabled in Appearance, and reduced-motion preferences are respected.

Studio fixes include comparison-based dirty state, disabled editing during saves/uploads, revision conflicts that retain local edits, structured inline field errors, undo for in-memory removals, project cover uploads, file-signature and target-type validation, current-draft GitHub discovery, and a same-origin preview readiness handshake. The embedded preview receives current unsaved edits; standalone preview shows the saved draft. Publish is explicit and distinct from Save draft.

Local admin regression checks cover every theme's draft/preview/publish transition, duplicate IDs, concurrent writers, stale revisions, field errors, and unauthorized requests. Tests restore the original local draft and published content.

### Generated scene assets

Created with the built-in ImageGen tool. Project-local files:

- `/Users/abhishek/WorkSpace/port/public/assets/sunset-background.png`: original hand-painted anime sunset city, plum shadows, coral clouds, gold sun at right, darker sky at left, distant mountains, no nearby foreground or text.
- `/Users/abhishek/WorkSpace/port/public/assets/night-background.png`: original anime night city, indigo sky, ivory crescent moon, warm windows, left-hand space for copy, no foreground or text.
- `/Users/abhishek/WorkSpace/port/public/assets/night-foreground.png`: transparent anime rooftop and short-haired figure viewed from behind on the right, navy jacket with blue and warm rim lighting, no sky or city.
- `/Users/abhishek/WorkSpace/port/public/assets/night-mist.png`: transparent hand-painted pale-blue and indigo atmospheric wisps across the middle band, no landscape, person, background, or text.

Original generated files remain in the Codex generated-images directory. Foreground and mist alpha channels were verified. The Afterglow theme uses the dedicated sunset background; Nightfall and Evergreen use the night scene with theme-specific atmosphere.

The favicon also follows the chosen palette. Saving normalizes editable fields and updates the local baseline, so whitespace cleanup does not leave a false unsaved state.
