import { readFile, readdir, mkdir, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
const assets = {};
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json'};
async function collect(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const file = path.join(dir,entry.name);
    if (entry.isDirectory()) { await collect(file); continue; }
    const ext = path.extname(file);
    if (!types[ext]) continue;
    const data = await readFile(file);
    assets['/'+path.relative('public',file).replaceAll('\\','/')] = {type:types[ext],...ext==='.webp' ? {base64:data.toString('base64')} : {text:data.toString()}};
  }
}
await collect('public');
await mkdir('dist/server',{recursive:true});
const source = await readFile('worker/index.js','utf8');
const output = source.replace("import { assets } from './assets.js';",'const assets = '+JSON.stringify(assets)+';');
await writeFile('dist/server/index.js',output);
await cp('.openai','dist/.openai',{recursive:true});
console.log('Worker et fichiers du site compilés.');
