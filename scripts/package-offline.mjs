import fs from 'node:fs';import path from 'node:path';
const site=process.cwd(),root=path.resolve(site,'../triptotropicNEWo69');
if(!root.startsWith(path.resolve(site,'..')+path.sep))throw Error('Package must stay in workspace');
fs.mkdirSync(root,{recursive:true});const links=[];let bytes=0,files=0;
function copy(src,dst,{dependencies=false}={}){const stat=fs.lstatSync(src);if(stat.isFile()){const rel=path.relative(path.join(site,'dist/client'),src);if(!rel.startsWith('..')&&!path.isAbsolute(rel)){const original=path.join(site,'public',rel);if(fs.existsSync(original)&&fs.statSync(original).isFile()&&fs.readFileSync(original).equals(fs.readFileSync(src)))return;}}if(stat.isFile()){const rel=path.relative(path.join(site,'dist/client'),src);if(!rel.startsWith('..')&&!path.isAbsolute(rel)){const original=path.join(site,'public',rel);if(fs.existsSync(original)&&fs.statSync(original).isFile()&&fs.readFileSync(original).equals(fs.readFileSync(src)))return;}}if(stat.isSymbolicLink()){if(dependencies){const target=fs.realpathSync(src);if(!target.startsWith(site+path.sep))throw Error('External dependency: '+src);links.push({link:path.relative(root,dst),target:path.join('Site',path.relative(site,target))});}return;}if(stat.isDirectory()){fs.mkdirSync(dst,{recursive:true});for(const name of fs.readdirSync(src))copy(path.join(src,name),path.join(dst,name),{dependencies});}else{fs.mkdirSync(path.dirname(dst),{recursive:true});if(!fs.existsSync(dst)||fs.statSync(dst).size!==stat.size||fs.statSync(dst).mtimeMs<stat.mtimeMs)fs.copyFileSync(src,dst);bytes+=stat.size;files++;}}
const omit=new Set(['.git','node_modules','work','.next','.vinext','.wrangler','.sites-runtime','outputs','.claude','.codex','.agents']);
for(const name of fs.readdirSync(site)){if(omit.has(name)||name.startsWith('.env')&&name!=='.env.example'||name.endsWith('.tsbuildinfo'))continue;const src=path.join(site,name);if(name==='alien-archer-game-src'){fs.mkdirSync(path.join(root,'Site',name),{recursive:true});for(const sub of fs.readdirSync(src))if(sub!=='node_modules')copy(path.join(src,sub),path.join(root,'Site',name,sub));}else copy(src,path.join(root,'Site',name));}
copy(path.resolve(site,'../node_modules/electron/dist'),path.join(root,'App'));
copy(path.join(site,'desktop'),path.join(root,'App/resources/app'));
if(fs.existsSync(path.join(root,'App/electron.exe')))fs.renameSync(path.join(root,'App/electron.exe'),path.join(root,'App/Triptotropic.exe'));
copy(path.join(site,'docs'),path.join(root,'Guide'));
copy(path.join(site,'work/library-originals'),path.join(root,'Archive/Original complete PDFs'));
const old=path.resolve(site,'../site-source-audit/my-dick');for(const name of fs.readdirSync(old))if(!omit.has(name)&&!name.startsWith('.env'))copy(path.join(old,name),path.join(root,'Archive/Previous GitHub source',name));
copy(path.join(site,'node_modules'),path.join(root,'Site/node_modules'),{dependencies:true});
copy(path.join(site,'alien-archer-game-src/node_modules'),path.join(root,'Site/alien-archer-game-src/node_modules'),{dependencies:true});
fs.mkdirSync(path.join(root,'Tools'),{recursive:true});copy(process.execPath,path.join(root,'Tools/node.exe'));
copy(path.join(site,'desktop/restore-dependencies.mjs'),path.join(root,'Tools/restore-dependencies.mjs'));
fs.writeFileSync(path.join(root,'Tools/dependency-links.json'),JSON.stringify(links,null,2));
fs.writeFileSync(path.join(root,'OPEN TRIPTOTROPIC.cmd'),'@echo off\r\nstart "" "%~dp0App\\Triptotropic.exe"\r\n');
fs.writeFileSync(path.join(root,'Tools/BUILD SITE.cmd'),'@echo off\r\ncd /d "%~dp0.."\r\nset "PATH=%~dp0;%PATH%"\r\n"%~dp0node.exe" "%~dp0restore-dependencies.mjs"\r\nif errorlevel 1 goto done\r\ncd Site\r\n"%~dp0node.exe" node_modules\\vinext\\dist\\cli.js build\r\n:done\r\npause\r\n');
fs.writeFileSync(path.join(root,'Tools/EDIT AND PREVIEW.cmd'),'@echo off\r\ncd /d "%~dp0.."\r\nset "PATH=%~dp0;%PATH%"\r\n"%~dp0node.exe" "%~dp0restore-dependencies.mjs"\r\nif errorlevel 1 goto done\r\ncd Site\r\n"%~dp0node.exe" node_modules\\vinext\\dist\\cli.js dev --host 127.0.0.1 --port 5173\r\n:done\r\npause\r\n');
fs.mkdirSync(path.join(root,'Data'),{recursive:true});
fs.writeFileSync(path.join(root,'START HERE.txt'),'TRIPTOTROPIC NEWo69\r\n\r\nDouble-click OPEN TRIPTOTROPIC.cmd or App\\Triptotropic.exe.\r\nRead Guide\\START HERE.html for controls, files, books, editing and backups.\r\nKeep this whole folder together. No installation or internet is required to play.\r\n');
console.log(JSON.stringify({root,files,bytes,dependencyLinks:links.length}));
