import { assets } from './assets.js';
const statuses = ['brouillon','disponible','reserve','vendu','archive'];
const types = ['Citadine','Berline','SUV / 4x4','Break','Coupé','Cabriolet','Monospace','Utilitaire'];
const fuels = ['Essence','Diesel','Hybride','Hybride rechargeable','Électrique','GPL'];
const gears = ['Manuelle','Automatique'];
const json = (data, status = 200) => Response.json(data, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const fail = (message, status = 400) => { throw Object.assign(new Error(message), {status}); };
const isSeller = (request, env) => Boolean(
  env.SELLER_EMAIL && request.headers.get('oai-authenticated-user-email')?.toLowerCase() === env.SELLER_EMAIL.toLowerCase()
  || env.ADMIN_API_TOKEN && request.headers.get('Authorization') === 'Bearer ' + env.ADMIN_API_TOKEN
);
function seller(request, env) {
  if (!isSeller(request, env)) fail('Connectez-vous avec le compte vendeur.', 403);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) fail('Origine de requête invalide.',403);
}
function view(row, privateView = false) {
  const data = JSON.parse(row.data);
  if (!privateView) delete data.plate;
  return {...data,id:String(row.id),ref:'AD94-'+String(row.id).padStart(3,'0'),status:row.status,revision:row.revision,updatedAt:row.updated_at};
}
function validate(input, status) {
  if (!input || typeof input !== 'object') fail('Annonce invalide.');
  const data = {};
  for (const [key,max] of Object.entries({brand:60,model:100,trim:150,plate:15,power:30,color:60,interior:60,description:10000})) {
    data[key] = String(input[key] ?? '').trim();
    if (data[key].length > max) fail('Le champ '+key+' est trop long.');
  }
  if (!data.brand || !data.model) fail('Indiquez la marque et le modèle.');
  for (const [key,min,max] of [['year',1900,new Date().getFullYear()+1],['km',0,2000000],['price',0,10000000],['doors',2,7]]) {
    const empty = input[key] === '' || input[key] === null || input[key] === undefined;
    const value = empty ? null : Number(input[key]);
    if (value !== null && (!Number.isInteger(value) || value < min || value > max)) fail('Valeur invalide pour '+key+'.');
    data[key] = value;
  }
  for (const [key,choices] of [['type',types],['fuel',fuels],['gearbox',gears]]) {
    data[key] = String(input[key] || '');
    if (data[key] && !choices.includes(data[key])) fail('Choix invalide pour '+key+'.');
  }
  if (!Array.isArray(input.extras) || input.extras.length > 100) fail('Équipements invalides.');
  data.extras = [...new Set(input.extras.map(value => String(value).trim()).filter(Boolean))];
  if (data.extras.some(value => value.length > 100)) fail('Nom d’équipement trop long.');
  if (!Array.isArray(input.photos) || input.photos.length > 20) fail('Maximum 20 photos par véhicule.');
  data.photos = input.photos.map(photo => {
    if (typeof photo.id !== 'string' || !/^(?:[a-f0-9-]{36}|demo-(?:208|clio|golf|yaris|bmw|a3))$/.test(photo.id)) fail('Photo invalide.');
    return {id:photo.id,url:photo.id.startsWith('demo-') ? '/img/'+photo.id.slice(5)+'.webp' : '/media/'+photo.id};
  });
  if (new Set(data.photos.map(photo => photo.id)).size !== data.photos.length) fail('Photos en double.');
  if (status === 'disponible' || status === 'reserve') {
    if (data.year === null || data.km === null || !(data.price > 0) || !data.type || !data.fuel || !data.gearbox || !data.photos.length) {
      fail('Pour publier, complétez l’année, le kilométrage, le prix, le type, la motorisation, la boîte et ajoutez une photo.');
    }
  }
  return data;
}
async function body(request) {
  if (Number(request.headers.get('Content-Length')) > 100000) fail('Annonce trop volumineuse.',413);
  const text = await request.text();
  if (text.length > 100000) fail('Annonce trop volumineuse.',413);
  try { return JSON.parse(text); } catch { fail('Données invalides.'); }
}
async function checkPhotos(db, photos) {
  for (const photo of photos) {
    if (photo.id.startsWith('demo-')) continue;
    if (!await db.prepare('SELECT id FROM photos WHERE id = ?').bind(photo.id).first()) fail('Une photo manque. Ajoutez-la de nouveau.');
  }
}
async function api(request, env, url) {
  const db = env.DB;
  const path = url.pathname;
  const method = request.method;
  if (path === '/api/session' && method === 'GET') return json({seller:isSeller(request,env)});
  if (!db) fail('Le stockage du catalogue est indisponible.',503);
  const admin = path.startsWith('/api/admin/');
  if (admin) seller(request,env);
  if (path === '/api/vehicles' && method === 'GET') {
    const {results} = await db.prepare("SELECT * FROM vehicles WHERE deleted = 0 AND status IN ('disponible','reserve') ORDER BY id DESC").all();
    const phone = await db.prepare("SELECT value FROM settings WHERE key = 'phone'").first();
    return json({vehicles:results.map(row=>view(row)),phone:phone?.value || ''});
  }
  if (path === '/api/admin/vehicles' && method === 'GET') {
    const {results} = await db.prepare('SELECT * FROM vehicles WHERE deleted = 0 ORDER BY id DESC').all();
    const {results:options} = await db.prepare('SELECT name FROM equipment ORDER BY name COLLATE NOCASE').all();
    const phone = await db.prepare("SELECT value FROM settings WHERE key = 'phone'").first();
    return json({vehicles:results.map(row=>view(row,true)),equipment:options.map(row=>row.name),phone:phone?.value || ''});
  }
  if (path === '/api/admin/settings' && method === 'PUT') {
    const value = String((await body(request)).phone || '').trim();
    if (value && !/^\+[1-9]\d{7,14}$/.test(value)) fail('Utilisez le format international, par exemple +33612345678.');
    await db.prepare("INSERT INTO settings(key,value) VALUES ('phone',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(value).run();
    return json({phone:value});
  }
  if (path === '/api/admin/vehicles' && method === 'POST') {
    const input = await body(request);
    // A stable client key makes a retried create idempotent.
    if (!input || !/^[a-f0-9-]{36}$/.test(input.requestId || '')) fail('Identifiant de sauvegarde invalide.');
    const status = statuses.includes(input.status) ? input.status : 'brouillon';
    const data = validate(input,status);
    await checkPhotos(db,data.photos);
    await saveEquipment(db,data.extras);
    const now = new Date().toISOString();
    const result = await db.prepare('INSERT OR IGNORE INTO vehicles(seed_key,status,data,created_at,updated_at) VALUES (?,?,?,?,?) RETURNING *')
      .bind(input.requestId,status,JSON.stringify(data),now,now).first();
    const row = result || await db.prepare('SELECT * FROM vehicles WHERE seed_key = ?').bind(input.requestId).first();
    if (row.deleted) fail('Cette annonce a été supprimée.',409);
    return json({vehicle:view(row,true)},201);
  }
  const match = path.match(/^\/api\/admin\/vehicles\/(\d+)$/);
  if (match && (method === 'PUT' || method === 'DELETE')) {
    const input = await body(request);
    const row = await db.prepare('SELECT * FROM vehicles WHERE id = ? AND deleted = 0').bind(match[1]).first();
    if (!row) fail('Annonce introuvable.',404);
    if (!Number.isInteger(input.revision) || row.revision !== input.revision) fail('Cette annonce a changé sur un autre appareil. Rechargez la liste avant de la modifier.',409);
    const status = input.status || row.status;
    if (!statuses.includes(status)) fail('Statut invalide.');
    const data = method === 'DELETE' ? null : validate(input,status);
    if (data) await checkPhotos(db,data.photos);
    if (data) await saveEquipment(db,data.extras);
    const statement = method === 'DELETE'
      ? db.prepare('UPDATE vehicles SET deleted=1, revision=revision+1, updated_at=? WHERE id=? AND revision=? RETURNING *').bind(new Date().toISOString(),row.id,row.revision)
      : db.prepare('UPDATE vehicles SET data=?,status=?,revision=revision+1,updated_at=? WHERE id=? AND revision=? RETURNING *').bind(JSON.stringify(data),status,new Date().toISOString(),row.id,row.revision);
    const updated = await statement.first();
    if (!updated) fail('Une autre modification vient d’être enregistrée. Rechargez la liste.',409);
    return json({vehicle:view(updated,true)});
  }
  if (path === '/api/admin/photos' && method === 'POST') {
    const length = Number(request.headers.get('Content-Length'));
    if (length > 8*1024*1024) fail('Photo trop volumineuse (8 Mo maximum).',413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length < 12 || bytes.length > 8*1024*1024) fail('Photo invalide ou trop volumineuse.',413);
    let mime;
    if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) mime='image/jpeg';
    else if ([137,80,78,71,13,10,26,10].every((byte,index)=>bytes[index]===byte)) mime='image/png';
    else if (new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP') mime='image/webp';
    else fail('Utilisez une photo JPEG, PNG ou WebP.');
    const id = crypto.randomUUID();
    await env.BUCKET.put(id,bytes,{httpMetadata:{contentType:mime}});
    try { await db.prepare('INSERT INTO photos(id,mime,size,created_at) VALUES (?,?,?,?)').bind(id,mime,bytes.length,new Date().toISOString()).run(); }
    catch(error) { await env.BUCKET.delete(id); throw error; }
    return json({photo:{id,url:'/media/'+id}},201);
  }
  if (path === '/api/admin/import-demo' && method === 'POST') {
    const now = new Date().toISOString();
    const items = JSON.parse(assets['/demo.json'].text);
    await db.batch(items.map(car=>db.prepare('INSERT OR IGNORE INTO vehicles(seed_key,status,data,created_at,updated_at) VALUES (?,?,?,?,?)').bind('demo-'+car.id,'disponible',JSON.stringify(car),now,now)));
    await saveEquipment(db,items.flatMap(car=>car.extras));
    return json({success:true});
  }
  fail('Page introuvable.',404);
}
async function saveEquipment(db,names) {
  if (!names.length) return;
  await db.batch(names.map(name=>db.prepare('INSERT OR IGNORE INTO equipment(name) VALUES (?)').bind(name)));
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await api(request,env,url);
      if (url.pathname.startsWith('/media/')) {
        const id = url.pathname.slice(7);
        if (!/^[a-f0-9-]{36}$/.test(id)) return new Response('Introuvable',{status:404});
        if (!isSeller(request,env)) {
          const used = await env.DB.prepare("SELECT id FROM vehicles WHERE deleted=0 AND status IN ('disponible','reserve') AND EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.photos')) WHERE json_extract(value,'$.id')=?) LIMIT 1").bind(id).first();
          if (!used) return new Response('Introuvable',{status:404});
        }
        const object = await env.BUCKET.get(id);
        if (!object) return new Response('Introuvable',{status:404});
        return new Response(object.body,{headers:{'Content-Type':object.httpMetadata.contentType,'Cache-Control':'private, max-age=0','X-Content-Type-Options':'nosniff'}});
      }
      const asset = assets[url.pathname === '/' ? '/index.html' : url.pathname];
      if (!asset || url.pathname==='/demo.json') return new Response('Introuvable',{status:404});
      const body = asset.text ?? Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));
      return new Response(request.method==='HEAD' ? null : body,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
    } catch(error) {
      if (!error.status) console.error('Autodeal request failed',error.message);
      return json({error:error.status ? error.message : 'Une erreur est survenue. Réessayez dans un instant.'},error.status || 500);
    }
  }
};
