import fs from 'node:fs';
import * as si from 'simple-icons';
const choices={react:'siReact','react native':'siReact',typescript:'siTypescript',javascript:'siJavascript',redux:'siRedux','redux toolkit':'siRedux',python:'siPython',django:'siDjango',postgresql:'siPostgresql',git:'siGit',linux:'siLinux',neovim:'siNeovim',shell:'siGnubash','arch linux':'siArchlinux',github:'siGithub'};
const map=Object.fromEntries(Object.entries(choices).map(([name,key])=>[name,{path:si[key].path,hex:si[key].hex,title:si[key].title}]));
fs.writeFileSync('lib/brand-icons.ts','// Selected Simple Icons paths only; avoids loading the complete catalogue into the Worker.\nexport const brandIcons='+JSON.stringify(map)+' as const;\n');
console.log('Generated local icon paths for '+Object.keys(map).length+' names.');
