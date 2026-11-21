// Local preview only. Hosted authentication remains owned by the platform.
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdir,writeFile,unlink} from 'node:fs/promises';
import {readdirSync} from 'node:fs';
await mkdir('.local-data/photos',{recursive:true});
const sqlite=new DatabaseSync('.local-data/catalog.sqlite');
sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY)');
for(const file of readdirSync('drizzle').filter(name=>name.endsWith('.sql')).sort()){
 if(sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(file))continue;
 sqlite.exec(await readFile('drizzle/'+file,'utf8'));
 sqlite.prepare('INSERT INTO local_migrations VALUES (?)').run(file);
}
function prepared(query,args=[]){
 return {
  bind(...values){return prepared(query,values);},
  async first(){return sqlite.prepare(query).get(...args)||null;},
  async all(){return {results:sqlite.prepare(query).all(...args)};},
  async run(){return sqlite.prepare(query).run(...args);}
 };
}
const DB={
 prepare:query=>prepared(query),
 async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}
};
const BUCKET={
 async put(id,bytes,options){await writeFile('.local-data/photos/'+id,bytes);await writeFile('.local-data/photos/'+id+'.json',JSON.stringify(options.httpMetadata));},
 async get(id){try{return {body:await readFile('.local-data/photos/'+id),httpMetadata:JSON.parse(await readFile('.local-data/photos/'+id+'.json','utf8'))};}catch{return null;}},
 async delete(id){await Promise.all([unlink('.local-data/photos/'+id).catch(()=>{}),unlink('.local-data/photos/'+id+'.json').catch(()=>{})]);}
};
const {default:worker}=await import('../dist/server/index.js');
const port=Number(process.env.PORT||4173);
const env={DB,BUCKET,SELLER_EMAIL:'seller@localhost',ADMIN_API_TOKEN:'local-preview'};
http.createServer(async(incoming,outgoing)=>{
 try{
  const headers=new Headers();
  for(const [name,value] of Object.entries(incoming.headers))if(value)headers.set(name,Array.isArray(value)?value.join(','):value);
  // Loopback preview only. Explicit anonymous mode is used by API regression checks.
  headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');
  if(incoming.headers['x-preview-anonymous']!=='1')headers.set('oai-authenticated-user-email','seller@localhost');
  const chunks=[];for await(const chunk of incoming)chunks.push(chunk);
  const request=new Request('http://'+(incoming.headers.host||'localhost')+incoming.url,{method:incoming.method,headers,...['GET','HEAD'].includes(incoming.method)?{}:{body:Buffer.concat(chunks)}});
  const response=await worker.fetch(request,env);
  outgoing.writeHead(response.status,Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error);outgoing.writeHead(500);outgoing.end('Preview error');}
}).listen(port,'0.0.0.0',()=>console.log('Autodeal preview on port '+port));
