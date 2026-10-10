export const themes = [
 {id:'night',name:'Nightfall',description:'Midnight navy, ice blue, warm light.',colors:['#0b1120','#8ebaff','#ead2a1']},
 {id:'sunset',name:'Afterglow',description:'Deep plum, peach, golden hour.',colors:['#211323','#ffbc9d','#f2d99f']},
 {id:'forest',name:'Evergreen',description:'Forest ink, mint, soft amber.',colors:['#0d1c1b','#9ad5ba','#e1c99b']},
] as const;
export type ThemeId=typeof themes[number]['id'];
export function themeIcon(theme:ThemeId){const palette=themes.find(t=>t.id===theme)!;return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${palette.colors[0]}"/><text x="32" y="40" text-anchor="middle" fill="${palette.colors[1]}" font-family="Arial,sans-serif" font-size="25" font-weight="700">AT</text><circle cx="52" cy="52" r="4" fill="${palette.colors[2]}"/></svg>`);}
