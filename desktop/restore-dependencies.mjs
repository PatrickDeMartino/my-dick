import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const item of JSON.parse(fs.readFileSync(path.join(root,'Tools/dependency-links.json'),'utf8'))){const link=path.resolve(root,item.link),target=path.resolve(root,item.target);if(!link.startsWith(root+path.sep)||!target.startsWith(root+path.sep))throw Error('Invalid dependency path');try{fs.lstatSync(link);continue;}catch{}fs.mkdirSync(path.dirname(link),{recursive:true});fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');}
console.log('Offline editing dependencies are ready.');
