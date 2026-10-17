import { getPalette } from './theme';
import type { Content } from './content';
export const iconPromptDefault = `Create a themed icon for {name} ({kind}) for my Indian anime-inspired software engineer portfolio. Preserve the recognizable original brand silhouette; do not invent a company logo. For company or technology marks, if no reference logo is supplied, ask for its official logo first. For interface icons, use the familiar standard symbol for the named action. Style: {style}. Use foreground {foreground}, accent {accent}, background {background}. Match a 24×24 viewBox, clean balanced geometry, 2px strokes for interface symbols, rounded joins, generous negative space, consistent optical weight and 2px safe padding. For a solid brand mark, preserve the original proportions instead of adding strokes. No text, gradients, shadow, scenic background, frame or decorative border. Provide an SVG source and a 512×512 transparent PNG export for upload. Supply a light-mode and a dark-mode version if more than one colour is required. Keep the icon legible at 20px and 32px. Do not change trademark geometry.`;
export type Skill = { id: string; name: string; category: 'Mobile' | 'Frontend' | 'Backend' | 'Tools' };
export function effectiveSkills(c: Pick<Content, 'skillItems' | 'skills'>): Skill[] {
  if (c.skillItems !== null) return c.skillItems;
  return c.skills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: 'legacy-' + i,
      name,
      category: /react native/i.test(name)
        ? 'Mobile'
        : /react|typescript|javascript|redux|vue|css|html/i.test(name)
          ? 'Frontend'
          : /python|django|sql|api|postgres/i.test(name)
            ? 'Backend'
            : 'Tools'
    }));
}
export function iconPalette(theme: Content['theme'], mode: Content['colorMode']) {
  const p = getPalette(theme, mode);
  return { background: p.bg, foreground: p.text, accent: p.accent };
}
export function makeIconPrompt(c: Content, name: string, kind: string) {
  const palette = iconPalette(c.theme, c.colorMode),
    values: Record<string, string> = {
      ...palette,
      name,
      kind,
      style:
        c.iconStyle === 'themed'
          ? 'monochrome with a restrained accent, clean ink contours consistent with the anime-inspired site, no scene'
          : 'original brand colour with consistent scale and spacing'
    };
  return c.iconPromptTemplate.replace(
    /\{(name|kind|foreground|background|accent|style)\}/g,
    (_, key) => values[key]
  );
}
