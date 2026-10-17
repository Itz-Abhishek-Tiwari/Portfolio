export const themeIds = [
  'night',
  'sunset',
  'forest',
  'indigo',
  'lotus',
  'sandstone',
  'ocean',
  'graphite',
  'ember',
  'neon',
  'frost',
  'retro',
  'pastel',
  'citrus'
] as const;
export type ThemeId = (typeof themeIds)[number];
export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  soft: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  buttonText: string;
  danger: string;
  success: string;
};
function palette(values: string[], mode: 'dark' | 'light'): Palette {
  const [bg, surface, surface2, soft, text, muted, faint, line, accent, accent2, accentSoft, buttonText] =
    values;
  return {
    bg,
    surface,
    surface2,
    soft,
    text,
    muted,
    faint,
    line,
    accent,
    accent2,
    accentSoft,
    buttonText,
    danger: mode === 'dark' ? '#f7a6a6' : '#b12b38',
    success: mode === 'dark' ? '#acd2b6' : '#276844'
  };
}
const registry = {
  night: {
    name: 'Nightfall',
    description: 'Slate, porcelain, and blue ink.',
    dark: [
      '#161a1f',
      '#20262d',
      '#2c343d',
      '#242b32',
      '#f3eee5',
      '#b6b8b7',
      '#8b969e',
      '#3b434c',
      '#b8c5d6',
      '#d7b780',
      '#444d57',
      '#17202a'
    ],
    light: [
      '#fafbfe',
      '#ffffff',
      '#eaf0f8',
      '#f0f4fa',
      '#202d40',
      '#536278',
      '#647286',
      '#c6cfde',
      '#365da7',
      '#977329',
      '#dce7fa',
      '#ffffff'
    ]
  },
  sunset: {
    name: 'Afterglow',
    description: 'Terracotta, warm ivory, and sunset gold.',
    dark: [
      '#231d1b',
      '#2d2522',
      '#3d302b',
      '#332925',
      '#f9eedd',
      '#c1b3a8',
      '#a58b7c',
      '#514139',
      '#e6a07e',
      '#debd83',
      '#614335',
      '#311e17'
    ],
    light: [
      '#fff7ed',
      '#fffdf9',
      '#ffe8d9',
      '#fff0e3',
      '#3b261e',
      '#79564b',
      '#875f50',
      '#dfc8b8',
      '#a64429',
      '#987124',
      '#f8d8c5',
      '#ffffff'
    ]
  },
  forest: {
    name: 'Evergreen',
    description: 'Sage, fresh paper, and deep forest.',
    dark: [
      '#19231f',
      '#24312a',
      '#33443a',
      '#2a382f',
      '#f0efdf',
      '#b7c2b5',
      '#90a08e',
      '#445649',
      '#b8cca1',
      '#d7bc88',
      '#455940',
      '#1c291d'
    ],
    light: [
      '#f5faf2',
      '#ffffff',
      '#e1edd9',
      '#edf5e7',
      '#203b2b',
      '#536e59',
      '#607164',
      '#c6d9c2',
      '#2b6944',
      '#917027',
      '#d9ead1',
      '#ffffff'
    ]
  },
  indigo: {
    name: 'Indigo dusk',
    description: 'Violet ink, lavender, and moonlight.',
    dark: [
      '#191728',
      '#252138',
      '#332d48',
      '#2b253d',
      '#f3eefc',
      '#bdb2d4',
      '#9485b1',
      '#49405f',
      '#b9a3f0',
      '#e5c49a',
      '#4c3c70',
      '#20172e'
    ],
    light: [
      '#fbf9ff',
      '#ffffff',
      '#eee7fd',
      '#f3edff',
      '#302044',
      '#695878',
      '#7c648f',
      '#d5c6e7',
      '#6b469e',
      '#937033',
      '#e4d4f8',
      '#ffffff'
    ]
  },
  lotus: {
    name: 'Lotus bloom',
    description: 'Rose, plum, and soft pink paper.',
    dark: [
      '#281820',
      '#38232e',
      '#4b303e',
      '#3e2833',
      '#fff0f4',
      '#d0afb9',
      '#aa8794',
      '#604250',
      '#e9a6b9',
      '#e0c08c',
      '#683d51',
      '#331823'
    ],
    light: [
      '#fff8fa',
      '#ffffff',
      '#fce5ec',
      '#fff0f4',
      '#492632',
      '#80616b',
      '#875f70',
      '#e4c8d2',
      '#a13d60',
      '#8e7034',
      '#f5d5e0',
      '#ffffff'
    ]
  },
  sandstone: {
    name: 'Sandstone',
    description: 'Ochre, parchment, and carved stone.',
    dark: [
      '#27231c',
      '#342f25',
      '#484033',
      '#3b3429',
      '#f8efda',
      '#c6bca7',
      '#a1957b',
      '#5b513e',
      '#dfc28b',
      '#e5a982',
      '#625239',
      '#2e2617'
    ],
    light: [
      '#fffcf3',
      '#ffffff',
      '#f1e6cd',
      '#f9f2df',
      '#3d311e',
      '#77684d',
      '#806f55',
      '#dacfaf',
      '#865718',
      '#a84c2e',
      '#ebdbb6',
      '#ffffff'
    ]
  },
  ocean: {
    name: 'Ocean air',
    description: 'Teal, sea glass, and clean white.',
    dark: [
      '#142429',
      '#1f3238',
      '#2d454c',
      '#263a40',
      '#e6f6f6',
      '#adc9cd',
      '#7eaaae',
      '#3b5a62',
      '#8dd6d3',
      '#e3c995',
      '#2f5e60',
      '#102b2e'
    ],
    light: [
      '#f3fcfc',
      '#ffffff',
      '#ddefef',
      '#e9f6f6',
      '#173a41',
      '#4d6e73',
      '#506e72',
      '#bfdddd',
      '#176c75',
      '#967027',
      '#d1ebeb',
      '#ffffff'
    ]
  },
  graphite: {
    name: 'Graphite',
    description: 'Ink black, chalk white, and one sharp signal.',
    dark: [
      '#121212',
      '#1b1b1b',
      '#262626',
      '#1f1f1f',
      '#f2f2ef',
      '#b4b4b0',
      '#8a8a86',
      '#333333',
      '#f5f5f0',
      '#ff6b4a',
      '#3a3a3a',
      '#121212'
    ],
    light: [
      '#f7f7f5',
      '#ffffff',
      '#eaeae7',
      '#f0f0ed',
      '#141414',
      '#555552',
      '#6b6b67',
      '#d4d4d0',
      '#141414',
      '#c43a1a',
      '#e4e4e0',
      '#ffffff'
    ]
  },
  ember: {
    name: 'Ember',
    description: 'Crimson coals, smoke, and brass.',
    dark: [
      '#1f1416',
      '#2a1b1e',
      '#3a2529',
      '#311f23',
      '#f8ebe6',
      '#c9aeab',
      '#a2847f',
      '#4c3135',
      '#f0857a',
      '#e8b86d',
      '#5c2e31',
      '#2a1012'
    ],
    light: [
      '#fff6f4',
      '#ffffff',
      '#fbe2de',
      '#fdeeeb',
      '#3d1a1d',
      '#7a4f52',
      '#865a5c',
      '#e7c6c3',
      '#b3242f',
      '#8f6a1f',
      '#f6d2ce',
      '#ffffff'
    ]
  },
  neon: {
    name: 'Neon midnight',
    description: 'Midnight blue, electric periwinkle, and magenta.',
    dark: [
      '#13141f',
      '#1b1d2c',
      '#272a3e',
      '#202234',
      '#e4e7fb',
      '#a9aed0',
      '#7d83aa',
      '#33374f',
      '#7aa2f7',
      '#e086d3',
      '#2c3557',
      '#101321'
    ],
    light: [
      '#f6f7fd',
      '#ffffff',
      '#e6e9f8',
      '#eef0fb',
      '#1d2140',
      '#4d5378',
      '#5d6388',
      '#c9cde6',
      '#3456c4',
      '#a83a95',
      '#dae0f8',
      '#ffffff'
    ]
  },
  frost: {
    name: 'Nordic frost',
    description: 'Polar slate, frost blue, and aurora green.',
    dark: [
      '#20252e',
      '#2a303b',
      '#363e4c',
      '#2f3542',
      '#eceff4',
      '#bcc4d1',
      '#939eb0',
      '#434c5e',
      '#88c0d0',
      '#a3be8c',
      '#3b4d5e',
      '#1d2730'
    ],
    light: [
      '#f4f6f9',
      '#ffffff',
      '#e3e8ef',
      '#eceff4',
      '#242a35',
      '#4c566a',
      '#5a6478',
      '#cdd4df',
      '#2e6f8a',
      '#557a3c',
      '#d6e4ec',
      '#ffffff'
    ]
  },
  retro: {
    name: 'Retro amber',
    description: 'Tape-deck brown, amber, and olive.',
    dark: [
      '#1d1a16',
      '#282420',
      '#37312b',
      '#2e2925',
      '#ebdbb2',
      '#bdae93',
      '#998b74',
      '#4a4239',
      '#fabd2f',
      '#b8bb26',
      '#5a4a1f',
      '#1d1a16'
    ],
    light: [
      '#fbf4e3',
      '#fffaf0',
      '#efe3c4',
      '#f6ecd3',
      '#3c3836',
      '#665c54',
      '#73685e',
      '#dccfae',
      '#9a5b06',
      '#5f6b12',
      '#f0dfb0',
      '#ffffff'
    ]
  },
  pastel: {
    name: 'Pastel night',
    description: 'Soft mauve, peach, and lavender on deep ink.',
    dark: [
      '#1e1e2e',
      '#27273a',
      '#33344a',
      '#2b2b40',
      '#eae7f6',
      '#b9b6d0',
      '#908ca9',
      '#3d3d57',
      '#cba6f7',
      '#fab387',
      '#463a63',
      '#1e1a2e'
    ],
    light: [
      '#faf8fd',
      '#ffffff',
      '#efeaf8',
      '#f4f0fb',
      '#2f2a44',
      '#615b7a',
      '#6e6889',
      '#d8d1e8',
      '#7a43c7',
      '#b5531c',
      '#e8dcf9',
      '#ffffff'
    ]
  },
  citrus: {
    name: 'Citrus grove',
    description: 'Lime zest, olive dark, and sunshine.',
    dark: [
      '#171c12',
      '#20271a',
      '#2d3624',
      '#252d1e',
      '#f1f4e4',
      '#bfc7aa',
      '#97a283',
      '#3c4630',
      '#c6e36b',
      '#f2c14e',
      '#3f4d22',
      '#161d0b'
    ],
    light: [
      '#fafcf0',
      '#ffffff',
      '#eaf1d5',
      '#f2f7e2',
      '#25301a',
      '#56633f',
      '#626f4b',
      '#d2ddb8',
      '#4d7a12',
      '#9a6a00',
      '#e3efc4',
      '#ffffff'
    ]
  }
} as const;
export function getPalette(theme: ThemeId, mode: 'dark' | 'light') {
  return palette([...registry[theme][mode]], mode);
}
export const themes = themeIds.map(id => ({
  id,
  name: registry[id].name,
  description: registry[id].description,
  colors: [registry[id].dark[0], registry[id].dark[8], registry[id].dark[9]]
}));
export function themeIcon(theme: ThemeId, mode: 'dark' | 'light' = 'dark') {
  const p = getPalette(theme, mode);
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${p.bg}"/><text x="32" y="40" text-anchor="middle" fill="${p.accent}" font-family="Arial,sans-serif" font-size="25" font-weight="700">AT</text><circle cx="52" cy="52" r="4" fill="${p.accent2}"/></svg>`
    )
  );
}
