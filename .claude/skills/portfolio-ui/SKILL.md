---
name: portfolio-ui
description: House style and working rules for this portfolio's public site — editorial visual language, GSAP/ScrollTrigger motion patterns, the theme palette system, and the checks to run. Use for any change to how the site looks or moves: restyling or reworking a section, adding animation or "GSAP stuff", making something "more beautiful", building or restyling a component (menus, dropdowns, players, cards), or adding or editing a colour theme.
---

# Portfolio UI

The public site is an **editorial** design: serif display type, hairline rules, numbered rows, lots of air, one accent colour. New UI must look like it was always part of it. When something "doesn't match the site aesthetic", it's almost always a generic app pattern (rounded floating cards, grey highlight blocks, checkmarks, default form controls) that should become the editorial equivalent below.

## Where things live

| What | Where |
|---|---|
| Home sections (server components) | `components/home/*.tsx`, composed in `components/home/portfolio.tsx` |
| Header, menu, footer, shell | `components/site/` |
| Music player | `components/music/` (widget lazy-loads the player and the YouTube API) |
| Shared UI (select, icons, markdown) | `components/ui/` |
| Admin studio (separate look, `styles/studio.css`) | `components/studio/`, `app/admin/` |
| Motion hooks | `hooks/use-*-motion.ts`, `hooks/use-smooth-scroll.ts`, `hooks/use-reduced-motion.ts` |
| GSAP entry point | `lib/gsap.ts` → `scrollMotion()` returns `{ gsap, ScrollTrigger }` with the plugin registered |
| Site styles | `styles/site.css` (public), `styles/tokens.css` (type scale, durations, controls, layout, radii, z-index), `styles/base.css` (reset) |
| Colour palettes | `lib/theme.ts` → generated `styles/themes.css` |
| Content schema and defaults | `lib/content.ts` (zod); editable content comes from the studio, not hard-coded |

## Visual language

Use these, in this order of preference:

- **Type:** headings and display text in `var(--serif)` (Instrument Serif), with `<em>` for the italic accent word (`My AI <em>toolkit</em>`). Body text is `var(--sans)`. Small numbers, times and indices use `var(--mono)`. Kickers are `.section-kicker` (small uppercase).
- **Structure:** lists are rows separated by hairlines. The list opens with `border-top: 1px solid var(--text)` and each row has `border-bottom: 1px solid var(--line)`. Prefer this over cards and grids of boxes.
- **Numbering:** rows carry a zero-padded index (`String(i + 1).padStart(2, '0')`) in mono, `var(--faint)`.
- **Hover and active state:** turn the text `var(--accent)`, slide it a little right with `translateX(8–12px)` and the `var(--ease)` curve, and optionally italicise it. Avoid solid fills, inverted text, and grey highlight blocks.
- **Selected or current item:** italic text plus a small accent dot or line, not a checkmark.
- **Shape:** the public site is mostly square. Rounding is reserved for floating chrome (the music player, the pill buttons with `var(--radius-pill)`, round icon buttons).
- **Section layout:** each `section.section-wrap` starts with `.section-heading` (kicker in the left rail, `h2` in the content column, optional `.section-heading-aside`). On ≥900px, content is offset by the rail automatically.
- **Images:** match `aspect-ratio` to the real asset (check with `sips -g pixelWidth -g pixelHeight <file>`). `object-fit: cover` in a box of the wrong ratio crops the sides.

## Tokens (the single source of truth)

Every size, duration and control dimension comes from `styles/tokens.css`. Pick the token for the element's **role**; never write a new `clamp()`, pixel font size or transition duration in `site.css`. If no role fits, add a token there first and document it here.

**Serif (display) scale**

| Token | Role |
|---|---|
| `--fs-hero` | Home hero headline |
| `--fs-wordmark` | Footer wordmark |
| `--fs-closing` | Contact closing headline |
| `--fs-display` | Inner-page `h1` |
| `--fs-h2` | Section headings, ticker, banner quote, empty states |
| `--fs-h3` | Big list titles: projects, posts, AI tools, the About statement |
| `--fs-h4` | Row titles: journal, repos, services, workbench, email link, article `h2` |
| `--fs-h5` | Small titles: experience, games, show-more, sheet and dialog titles |
| `--fs-h6` | Serif list items: skills, select options |
| `--fs-serif-md` / `--fs-serif-sm` | Fixed serif labels (24px brand and card names / 22px facts, handles, values) |
| `--fs-note` | Italic asides and credits |

**Sans scale:** `--fs-micro` 11 (definition labels) · `--fs-kicker` 12 (kickers, mono counters) · `--fs-meta` 13 (row metadata, captions) · `--fs-small` 14 (secondary UI, dates) · `--fs-ui` 15 (buttons, links) · `--fs-body-sm` 16 (row descriptions) · `--fs-body` 17 (reading) · `--fs-lead` 18 (intros).

**Durations:** `--dur-fast` 0.2s (input borders, tiny flips) · `--dur-base` 0.3s (colour) · `--dur-move` 0.5s (hover nudges, with `--ease`) · `--dur-slow` 0.7s (reveals, accent lines) · `--dur-curtain` 0.8s (full-screen wipes, with `--ease-curtain`) · `--dur-settle` 1.1s (image zooms). Keyframe loops (equalisers, ticker, pulses) and stagger delays keep their own tuned values.

**Controls:** `--control-sm` 38px (header icons, banner arrows on mobile) · `--control` 44px (round icon buttons) · `--control-lg` 47px (the height of a pill button, for anything sitting beside one).

**Deliberate exceptions** (leave them alone): the music player's internal type, the menu links (`8vh`, sized to fit the screen height) and fixed numeric displays (scores, track positions).

## Components

Reuse these before writing new rules:

- **Pill buttons:** `.solid-button` (primary) and `.outline-button` (secondary). The hover inverts the fill.
- **Text links:** `.text-link` / `.text-button`. The underline retracts on hover.
- **Round icon buttons:** `.round-button` (`--control`, hairline border, accent on hover). Add a modifier class only for context, like `.band-arrow` (tinted for use over images) or `.resume-close` (the ✕ rotates). Beside pills, use `.outline-button.is-round` instead, which matches the pill's height and hover.
- **Kickers:** `.section-kicker` (sans, uppercase, `--fs-kicker`, 0.1em tracking). Mono is only for numbers, indices and counters.
- **Masked text reveals:** `.line > span` inside an `overflow: hidden` line (hero, contact, banner quote). Split into word spans when words should stagger.
- **Overlays and sheets:** portal into `.site` (not `body`, which has no theme variables), lock the scroll with `setScrollLock`, close on Escape, move focus in and back out, and open with a `--ease-curtain` clip-path wipe (see the menu and `resume-preview.tsx`).


Only use theme variables: `--bg`, `--surface`, `--surface-2`, `--surface-soft`, `--text`, `--muted`, `--faint`, `--line`, `--accent`, `--accent-2`, `--accent-soft`, `--button-text`, `--danger`, `--success`. For tints, use `color-mix(in srgb, var(--accent) 12%, transparent)`. Never hard-code a hex in `site.css`, except fixed-material details like the black vinyl in the music player.

Every rule must work in all 14 themes × dark and light. **Graphite** has `--accent` equal to `--text`, so an accent-only state change is invisible there. Pair it with movement or italics.

### Adding or editing a theme

1. Add the id to `themeIds` and an entry to `registry` in `lib/theme.ts`. Each mode has 12 hex values in this order: `bg, surface, surface2, soft, text, muted, faint, line, accent, accent2, accentSoft, buttonText`.
2. Run `npm run themes:generate` to rewrite `styles/themes.css`. Never edit that file by hand.
3. Check contrast: `text`, `muted`, `faint` and `accent` against `bg`, and `buttonText` against `accent`, must all be ≥ 4.5:1.
4. The studio's Appearance panel picks the new theme up automatically.

## Motion (GSAP)

Home-page motion lives in `hooks/use-portfolio-motion.ts`; header and menu motion in `hooks/use-header-motion.ts`; inner pages in `hooks/use-reader-motion.ts`. Add new section motion to the matching hook rather than to components, so the home page stays server-rendered.

Pattern for every effect:

```ts
useEffect(() => {
  if (!root.current || !enabled || reducedMotion) return;
  const { gsap, ScrollTrigger } = scrollMotion();
  const ctx = gsap.context(() => {
    /* tweens and ScrollTriggers, selectors scoped to root */
  }, root.current);
  return () => ctx.revert(); // also remove any event listeners you added
}, [root, enabled, reducedMotion]);
```

Rules learned the hard way:

- **Reduced motion:** always bail on `useReducedMotion()` (or `prefersReducedMotion()` for one-off checks), and add a `@media (prefers-reduced-motion: reduce)` fallback for CSS animations.
- **Don't let GSAP and a CSS `transition: transform` fight over one element.** Animate a wrapper or a child instead, or `gsap.set(el, { transition: 'none' })` and then `clearProps: 'transform,transition'` when the tween ends.
- **Leftover transforms break pinning:** a transform on an ancestor breaks `position: fixed`, which ScrollTrigger pins rely on. Entrance tweens on anything that contains a pinned element must end with `clearProps: 'transform'`.
- **Desktop-only effects:** wrap pins and cursor effects in `gsap.matchMedia()` (pins: `(min-width: 900px)`; cursor or magnetic effects: `(hover: hover) and (pointer: fine)`), and revert it in the cleanup.
- **Pointer-follow effects:** use `gsap.quickTo` for magnetic or parallax motion. Keep amplitudes small (≤ 0.4× the offset, ≤ 30px).
- **Reveals:** use `ScrollTrigger.batch(targets, { start: 'top 92%', once: true, onEnter })` with `stagger` 0.07–0.1. Text rising out of a mask means `overflow: hidden` on the wrapper and `yPercent: 110 → 0` with `expo.out` on the inner span.
- **Scrubbed effects:** use `scrub: 0.6`, `ease: 'none'`; image drift `yPercent ±6`, reveal by `clipPath: inset(...)`.
- **Inline transforms need a box:** a transform on an inline `<span>` does nothing. Make it `inline-block`, or rely on flex or grid children.
- **Text that swaps on state change:** animate it in `useLayoutEffect`, so the new text never flashes before the tween starts.
- **Stable effect dependencies:** helpers like `spotifySource()` return a new object on every render, so put `!!value` in the dependency array, not the object.
- **Easing vocabulary:** `expo.out` for entrances, `power3.out` for follow-ups, `back.out(1.5)` for small pops, and the CSS vars `--ease` and `--ease-curtain` (with the `--dur-*` tokens) for CSS transitions.
- **CSS pre-hides need a GSAP reset:** if `site.css` hides something with a transform before hydration (the hero headline does), start the tween with `y: 0` as well. Otherwise GSAP parses the CSS transform into a lasting pixel offset.

Page scroll is Locomotive Scroll (Lenis) wired to `ScrollTrigger.update` in `use-smooth-scroll.ts`, so don't add another smooth-scroll library.

## Code style

- **CSS:** `styles/site.css` writes **one rule per line**, grouped under `/* ---------- Section ---------- */` banners. Keep that style (don't run Prettier on it). Mobile overrides go in the `@media (max-width: 899px)` responsive block near the end, or a local media query next to the component's rules.
- **TS/TSX:** formatted with Prettier (`.prettierrc.json`). Single quotes, no trailing commas, short purpose comments above non-obvious effects.
- **Components:** home sections stay server components. Only `'use client'` islands (motion wrappers, music, forms, header) hydrate.
- **Next.js:** this project runs a newer Next.js than you know. Read `node_modules/next/dist/docs/` before using framework APIs (see `AGENTS.md`).

## Verify before reporting

```bash
npx tsc --noEmit -p .
npx eslint <changed files>
npx prettier --write <changed .ts/.tsx files>   # not site.css
npm run themes:generate                          # only after editing lib/theme.ts
```

The dev server is the user's own (`npm run dev`, plain `next dev` at `http://localhost:3000`, reading the Blob token from `.env.local`), and the sandbox usually can't reach the user's server, so say plainly when a change hasn't been seen in a browser and tell the user what to look at.
