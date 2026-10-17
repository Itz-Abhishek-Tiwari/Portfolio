import type { Content } from './content';
import { hasMusic } from './music';

/** The slice of content the client-side site chrome needs. Keeps page payloads small. */
export type SiteInfo = Pick<
  Content,
  'name' | 'theme' | 'colorMode' | 'motion' | 'github' | 'linkedin' | 'email'
> & {
  music: boolean;
  /** Whether the home page shows the game center, so the menu can link to it. */
  games: boolean;
};

export function siteInfo(c: Content): SiteInfo {
  return {
    name: c.name,
    theme: c.theme,
    colorMode: c.colorMode,
    motion: c.motion,
    github: c.github,
    linkedin: c.linkedin,
    email: c.email,
    music: hasMusic(c.music),
    games: c.games.length > 0
  };
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
