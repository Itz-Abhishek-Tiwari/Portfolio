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

Profile, links, skills, projects, project stories, project order, visibility, experience, portrait, résumé, and accent colors are editable. Save draft preserves the live content; Publish promotes the draft. `/admin/preview` displays the saved draft. Revision checks prevent overwriting newer changes from another session.

Content persists in D1. Uploaded JPG, PNG, WebP, and PDF files persist in R2, with size and signature validation. Initial content is supplied from the CV and verified NamiConfig README; app illustrations are conceptual, not screenshots of production apps.

## Hosting

Site identity and bindings are tracked in `.openai/hosting.json`. The first deployment is private for owner review. Site visibility and admin authorization are separate: changing the site audience does not remove server-side admin checks.

## Artwork

`public/assets/rooftop-ink.png` was generated with the built-in ImageGen tool. Prompt: panoramic fine-ink manga rooftop illustration on warm ivory paper, lone figure overlooking city roofs and distant mountains under a vermilion sun; limited ink/ivory/vermilion palette, analog crosshatching, no lettering or watermark. Original is preserved in the Codex generated-images directory.
