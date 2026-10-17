import fs from 'node:fs';
import {themeIds,getPalette} from '../../lib/theme.ts';
const names={bg:'bg',surface:'surface',surface2:'surface-2',soft:'surface-soft',text:'text',muted:'muted',faint:'faint',line:'line',accent:'accent',accent2:'accent-2',accentSoft:'accent-soft',buttonText:'button-text',danger:'danger',success:'success'};
let output='/* Generated from lib/theme.ts. Run npm run themes:generate after palette edits. */\n';
for(const id of themeIds)for(const mode of ['dark','light']){const selector=(id==='night'&&mode==='dark'?':root,':'')+'.theme-'+id+(mode==='light'?'.mode-light':'');output+=selector+'{'+Object.entries(getPalette(id,mode)).map(([key,value])=>'--'+names[key]+':'+value+';').join('')+'color-scheme:'+mode+'}\n';}
fs.writeFileSync('styles/themes.css',output);
console.log('Generated '+themeIds.length+' themes / '+themeIds.length*2+' palettes.');
