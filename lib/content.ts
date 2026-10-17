import { z } from 'zod';
import { gameSchema } from './games';
import { themeIds } from './theme';
import { iconPromptDefault } from './icon-system';
import { musicSupported } from './music';
const safeLink = z
  .string()
  .trim()
  .max(600)
  .refine(v => {
    try {
      const u = new URL(v);
      return ['https:', 'http:'].includes(u.protocol);
    } catch {
      return false;
    }
  }, 'Use an http or https URL');
const defaultAiTools = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    use: 'Agentic coding in the terminal: refactors, debugging and code reviews.',
    url: 'https://claude.com/product/claude-code'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    use: 'Research, drafting and rubber-duck debugging.',
    url: 'https://chatgpt.com'
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    use: 'Inline completions while I write code.',
    url: 'https://github.com/features/copilot'
  }
];
const asset = z
  .string()
  .trim()
  .max(600)
  .refine(v => v.startsWith('/assets/') || v.startsWith('/api/media/'), 'Use an uploaded asset');
export const projectSchema = z.object({
  id: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(100),
  category: z.enum(['Mobile', 'Web', 'Systems']),
  description: z.string().trim().min(1).max(700),
  story: z.string().max(6000).default(''),
  body: z.string().max(40000).default(''),
  slug: z
    .string()
    .max(120)
    .refine(v => !v || /^[a-z0-9-]+$/.test(v), 'Use lowercase letters, numbers, and hyphens')
    .default(''),
  liveUrl: safeLink.or(z.literal('')).default(''),
  githubUrl: safeLink.or(z.literal('')).default(''),
  stack: z.string().max(250),
  url: safeLink.optional().or(z.literal('')),
  image: asset.or(z.literal('')).default(''),
  featured: z.boolean()
});
// The banner between About and Work carries its own line, so it doesn't echo the hero headline.
const bandCaptionDefault = 'The details are not the details.\nThey make the design.';
const bandCreditDefault = 'Charles Eames';
// Extra banner images that rotate with bandImage in the slideshow.
const bandSlidesDefault = ['/assets/anime-indian-dusk.jpg'];
export const contentSchema = z
  .object({
    name: z.string().trim().min(1).max(70),
    role: z.string().trim().min(1).max(100),
    headline: z.string().trim().min(1).max(100),
    intro: z.string().trim().min(1).max(400),
    about: z.string().trim().min(1).max(1800),
    email: z.string().email(),
    github: safeLink.refine(v => {
      try {
        const u = new URL(v);
        return (
          u.protocol === 'https:' &&
          u.hostname === 'github.com' &&
          !u.username &&
          !u.password &&
          /^\/[a-zA-Z0-9-]{1,39}\/?$/.test(u.pathname)
        );
      } catch {
        return false;
      }
    }, 'Use a GitHub profile URL, such as https://github.com/your-name'),
    linkedin: safeLink.refine(v => {
      try {
        const u = new URL(v);
        return (
          u.protocol === 'https:' &&
          (u.hostname === 'linkedin.com' || u.hostname.endsWith('.linkedin.com')) &&
          !u.username &&
          !u.password &&
          u.pathname.startsWith('/in/')
        );
      } catch {
        return false;
      }
    }, 'Use a LinkedIn profile URL containing /in/'),
    portrait: asset,
    portraitIllustrated: asset.default('/assets/abhishek-indian-anime.png'),
    bandImage: asset.default('/assets/anime-indian-dusk.jpg'),
    bandSlides: z.array(asset).max(8).default(bandSlidesDefault),
    bandCaption: z.string().trim().max(100).default(bandCaptionDefault),
    bandCredit: z.string().trim().max(60).default(bandCreditDefault),
    resume: asset,
    availability: z.string().max(100),
    skills: z.string().max(800),
    skillItems: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().trim().min(1).max(60),
          category: z.enum(['Mobile', 'Frontend', 'Backend', 'Tools'])
        })
      )
      .max(80)
      .nullable()
      .default(null),
    aiTools: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().trim().min(1).max(60),
          use: z.string().trim().max(200).default(''),
          url: safeLink.or(z.literal('')).default('')
        })
      )
      .max(24)
      .default(defaultAiTools),
    games: z.array(gameSchema).max(12).default([]),
    iconAssets: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          name: z.string().trim().min(1).max(80),
          kind: z.enum(['skill', 'company', 'interface']),
          image: asset.or(z.literal('')),
          themed: z.boolean()
        })
      )
      .max(120)
      .default([]),
    iconStyle: z.enum(['themed', 'brand']).default('themed'),
    iconPromptTemplate: z.string().trim().min(1).max(8000).default(iconPromptDefault),
    accent: z.enum(['vermilion', 'jade', 'cobalt']),
    theme: z.enum(themeIds).default('sunset'),
    motion: z.boolean().default(true),
    colorMode: z.enum(['dark', 'light']).default('dark'),
    music: z
      .object({
        enabled: z.boolean(),
        title: z.string().trim().min(1).max(80),
        playlistUrl: z
          .string()
          .trim()
          .max(600)
          .refine(
            v => !v || musicSupported(v),
            'Use a YouTube, YouTube Music or Spotify song, album or playlist URL'
          )
      })
      .default({
        enabled: true,
        title: 'The soundtrack',
        playlistUrl: 'https://music.youtube.com/playlist?list=PLC6auEsbRMM0'
      }),
    projects: z.array(projectSchema).max(30),
    experience: z
      .array(
        z.object({
          id: z.string().max(100),
          role: z.string().trim().min(1).max(100),
          company: z.string().trim().min(1).max(100),
          period: z.string().max(100),
          description: z.string().max(700)
        })
      )
      .max(20)
  })
  .superRefine((value, ctx) => {
    for (const key of ['projects', 'experience', 'iconAssets', 'games'] as const) {
      const ids = new Set<string>();
      value[key].forEach((item, i) => {
        if (ids.has(item.id))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, i, 'id'],
            message: 'Each entry needs a unique ID'
          });
        ids.add(item.id);
      });
    }
    const names = new Set<string>();
    value.iconAssets.forEach((a, i) => {
      const key = a.kind + ':' + a.name.trim().toLowerCase();
      if (names.has(key))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['iconAssets', i, 'name'],
          message: 'This name already has an icon in the selected category'
        });
      names.add(key);
    });
    const skillIds = new Set<string>();
    value.skillItems?.forEach((skill, i) => {
      if (skillIds.has(skill.id))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['skillItems', i, 'id'],
          message: 'Each skill needs a unique ID'
        });
      skillIds.add(skill.id);
    });
    const slugs = new Set<string>();
    value.projects.forEach((p, i) => {
      const slug = p.slug || p.id;
      if (slugs.has(slug))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['projects', i, 'slug'],
          message: 'Another project uses this page slug'
        });
      slugs.add(slug);
    });
  });
export type Content = z.infer<typeof contentSchema>;
export const initialContent: Content = {
  name: 'Abhishek Tiwari',
  role: 'Software engineer · React Native developer',
  headline: 'Code with craft.\nBuild with soul.',
  intro:
    'I build React Native apps for Android and iOS and sweat the details. I run Arch Linux, and there’s a little anime in my DNA.',
  about:
    'I’m Abhishek, a software engineer. I build cross-platform mobile apps with React Native, work with APIs and application state, and care about how an interface feels as much as how it works.\n\nAway from production code, I build Linux desktops from scratch and experiment with web interfaces. I graduated in Computer Science from SKITM, Indore, with a CGPA of 8.07.',
  email: 'abhitiwariabhi7@gmail.com',
  github: 'https://github.com/Itz-Abhishek-Tiwari',
  linkedin: 'https://www.linkedin.com/in/itz-abhishek-tiwari/',
  portrait: '/assets/abhishek.jpg',
  portraitIllustrated: '/assets/abhishek-indian-anime.png',
  bandImage: '/assets/anime-indian-dusk.jpg',
  bandSlides: bandSlidesDefault,
  bandCaption: bandCaptionDefault,
  bandCredit: bandCreditDefault,
  resume: '/assets/abhishek-tiwari-cv.pdf',
  availability: 'Have a project or a role in mind? Write to me.',
  skillItems: null,
  aiTools: defaultAiTools,
  games: [],
  iconAssets: [],
  iconStyle: 'themed',
  iconPromptTemplate: iconPromptDefault,
  skills:
    'React Native, TypeScript, JavaScript, React, Redux Toolkit, REST APIs, Python, Django, SQL, Git, Linux, Neovim',
  accent: 'vermilion',
  theme: 'sunset',
  motion: true,
  colorMode: 'dark',
  music: {
    enabled: true,
    title: 'The soundtrack',
    playlistUrl: 'https://music.youtube.com/playlist?list=PLC6auEsbRMM0'
  },
  projects: [
    {
      id: 'wasalt',
      title: 'Wasalt',
      category: 'Mobile',
      description:
        'Contributed to a real estate mobile platform for Saudi Arabia. My work spans property discovery, location-based search, maps, caching, offline support, and core buying and auction modules.',
      story:
        'The application serves property seekers across Riyadh, Jeddah, Dammam, and Al-Khobar. I worked on location-based search and interactive map discovery, including nearby facilities such as schools, hospitals, mosques, and restaurants. My contributions also covered buying and selling, bidding, electronic auctions, real estate projects, and investment plans. Caching and offline support helped maintain a more reliable mobile experience.',
      stack: 'React Native / TypeScript / Redux / REST APIs',
      url: '',
      slug: '',
      body: '',
      liveUrl: '',
      githubUrl: '',
      image: '',
      featured: true
    },
    {
      id: 'mtp',
      title: 'My Ticket Partner',
      category: 'Mobile',
      description:
        'Contributed cross-platform task management and scheduling features, Redux state, API integration, and performance testing for field personnel.',
      story:
        'My work focused on the task-management and scheduling views used by field personnel. I contributed to development and debugging, supported senior developers with Redux state management, and integrated Axios-based API flows for task assignments. Performance testing across devices helped keep the interface responsive.',
      stack: 'React Native / Redux / JavaScript',
      url: '',
      slug: '',
      body: '',
      liveUrl: '',
      githubUrl: '',
      image: '',
      featured: true
    },
    {
      id: 'nami',
      title: 'NamiConfig',
      category: 'Systems',
      description:
        'An Arch Linux and Hyprland desktop built from scratch: modular dotfiles, one theme across every tool, a light/dark toggle, and a rebuilt SwayNC notification center.',
      story:
        'I built the desktop configuration from scratch to understand every part of my setup. GNU Stow keeps each configuration modular and easy to symlink. To control the notification center beyond CSS, I edited SwayNC’s Blueprint layout directly in its source and rebuilt it with Meson and Ninja.',
      stack: 'Arch Linux / Hyprland / GNU Stow / Shell',
      url: 'https://github.com/Itz-Abhishek-Tiwari/NamiConfig',
      slug: '',
      body: '',
      liveUrl: '',
      githubUrl: 'https://github.com/Itz-Abhishek-Tiwari/NamiConfig',
      image: '',
      featured: true
    }
  ],
  experience: [
    {
      id: 'thoughtwin',
      role: 'Software Engineer',
      company: 'Thoughtwin IT Solution',
      period: 'Mar 2025 — Present',
      description:
        'Shipping React Native and TypeScript features, structuring Redux Toolkit state, integrating REST APIs, and profiling rendering performance on Android.'
    },
    {
      id: 'ideal',
      role: 'Backend Developer',
      company: 'Ideal IT Techno',
      period: 'Dec 2024 — Feb 2025',
      description:
        'Built bulk CSV booking and order-update workflows, improved notification error handling, and fixed bugs with test coverage.'
    }
  ]
};

/** The résumé link with a readable file name, e.g. "Abhishek-Tiwari-Resume.pdf". */
export function resumeLink(content: Pick<Content, 'name' | 'resume'>) {
  const base = content.name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const filename = (base || 'Resume') + (base ? '-Resume' : '') + '.pdf';
  const href = content.resume.startsWith('/api/media/')
    ? content.resume + '?download=' + encodeURIComponent(filename)
    : content.resume;
  return { href, filename };
}
