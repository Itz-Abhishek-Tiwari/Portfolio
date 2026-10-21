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

// Dates are printed from Intl's numeric parts only: Node and browsers ship different locale data
// ("21 Oct 2026 at 9:37 AM" vs "21 Oct 2026, 9:37 am"), which broke hydration of server-rendered times.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function istParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return {
    day: Number(get('day')),
    month: Number(get('month')),
    year: get('year'),
    hour: Number(get('hour')) % 24,
    minute: get('minute')
  };
}

/** "21 Oct 2026" in IST, identical on the server and in every browser. */
export function formatDate(iso: string) {
  const p = istParts(iso);
  return p.day + ' ' + MONTHS[p.month - 1] + ' ' + p.year;
}

/** "21 Oct 2026, 9:37 AM" in IST, identical on the server and in every browser. */
export function formatDateTime(iso: string) {
  const p = istParts(iso);
  return formatDate(iso) + ', ' + (p.hour % 12 || 12) + ':' + p.minute + ' ' + (p.hour < 12 ? 'AM' : 'PM');
}
