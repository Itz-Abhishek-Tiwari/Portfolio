import fs from 'node:fs';
import postcss from 'postcss';
import {build} from 'esbuild';
import {base,cookie} from './local-env.mjs';
const bundle=await build({entryPoints:['lib/icon-system.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {iconPalette}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const themeBundle=await build({entryPoints:['lib/theme.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {themeIds,getPalette}=await import('data:text/javascript;base64,'+Buffer.from(themeBundle.outputFiles[0].text).toString('base64'));
const css=postcss.parse(fs.readFileSync('styles/themes.css','utf8'));
const lum=h=>{const v=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const id of themeIds)for(const mode of ['dark','light']){
 const p=getPalette(id,mode),selector=(id==='night'&&mode==='dark'?':root,':'')+'.theme-'+id+(mode==='light'?'.mode-light':'');
 const rule=css.nodes.find(n=>n.type==='rule'&&n.selector===selector),values=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value])),prompt=iconPalette(id,mode);
 if(values['--bg']!==prompt.background||values['--text']!==prompt.foreground||values['--accent']!==prompt.accent)throw Error('Palette mismatch '+id+' '+mode);
 for(const key of ['text','muted','faint'])if(ratio(p[key],p.bg)<4.5)throw Error('Contrast below 4.5 '+id+' '+mode+' '+key);
 if(ratio(p.buttonText,p.accent)<4.5)throw Error('Button contrast below 4.5 '+id+' '+mode);
}
const headers={Cookie:cookie,Origin:base,'Content-Type':'application/json'},original=await(await fetch(base+'/api/admin/content',{headers})).json();
for(const id of themeIds){const r=await fetch(base+'/api/admin/content',{method:'PUT',headers,body:JSON.stringify({content:{...original.content,theme:id,colorMode:'light'},revision:0,publish:false})});if(r.status!==409)throw Error('Theme failed schema validation '+id+' '+r.status);}
console.log('PASS: 14 matching CSS/prompt palettes, text/secondary/button contrast ≥4.5:1, and seven valid API theme IDs. No draft or public content saved.');
