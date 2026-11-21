import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabasePublishableKey } from './supabase-config.js';
export const supabase = createClient(supabaseUrl,supabasePublishableKey);
const bucket=supabase.storage.from('vehicle-photos');
function errorMessage(error){
  if(error.message==='Invalid login credentials')return 'Adresse ou mot de passe incorrect.';
  if(error.message==='Email not confirmed')return 'Confirmez votre adresse avec l’e-mail reçu, puis connectez-vous.';
  if(error.message.includes('rate limit'))return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if(error.message.includes('JWT')||error.code==='PGRST301')return 'Votre connexion a expiré. Rechargez la page pour vous reconnecter.';
  return error.message||'Une erreur est survenue. Réessayez.';
}
async function rpc(name,params={}){
  const {data,error}=await supabase.rpc(name,params);
  if(error)throw new Error(errorMessage(error));
  return data;
}
async function hydrate(vehicles){
  const paths=[...new Set(vehicles.flatMap(car=>car.photos.map(photo=>photo.path).filter(Boolean)))];
  const urls=new Map();
  if(paths.length){
    const {data,error}=await bucket.createSignedUrls(paths,3600);
    if(error)throw new Error(errorMessage(error));
    for(const item of data){if(item.error)throw new Error('Une photo ne peut pas être chargée. Réessayez.');urls.set(item.path,item.signedUrl);}
  }
  return vehicles.map(car=>({...car,photos:car.photos.map(photo=>({...photo,url:photo.path?urls.get(photo.path):photo.url}))}));
}
export async function api(path,options={}){
  const payload=options.body?JSON.parse(options.body):{};
  if(path==='/api/session'){
    const {data:{session},error}=await supabase.auth.getSession();
    if(error)throw new Error(errorMessage(error));
    return {seller:session ? await rpc('autodeal_is_seller') : false,signedIn:Boolean(session)};
  }
  if(path==='/api/vehicles'||path==='/api/admin/vehicles'&&!options.method){
    const result=await rpc(path==='/api/vehicles'?'autodeal_catalog':'autodeal_admin_catalog');
    return {...result,vehicles:await hydrate(result.vehicles)};
  }
  if(path==='/api/admin/settings')return rpc('autodeal_save_phone',{p_phone:payload.phone});
  if(path==='/api/admin/import-demo'){
    const {default:examples}=await import('./demo.json');
    for(const car of examples){
      const result=await rpc('autodeal_admin_catalog');
      if(result.vehicles.some(existing=>existing.ref===car.id))continue;
      const stableId='00000000-0000-4000-8000-'+car.id.replace('AD94-','').padStart(12,'0');
      await rpc('autodeal_save_vehicle',{p_payload:{...car,status:'disponible'},p_request_id:stableId});
    }
    return {success:true};
  }
  const match=path.match(/^\/api\/admin\/vehicles(?:\/(\d+))?$/);
  if(match){
    if(options.method==='DELETE')return rpc('autodeal_delete_vehicle',{p_id:Number(match[1]),p_revision:payload.revision});
    const result=await rpc('autodeal_save_vehicle',{
      p_payload:payload,p_id:match[1]?Number(match[1]):null,p_revision:payload.revision??null,
      p_request_id:match[1]?null:payload.requestId
    });
    return {...result,vehicle:(await hydrate([result.vehicle]))[0]};
  }
  throw new Error('Action indisponible.');
}
api.uploadPhoto=async blob=>{
  const id=crypto.randomUUID();
  const path='vehicles/'+id+'.jpg';
  const {error}=await bucket.upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'60'});
  if(error)throw new Error(errorMessage(error));
  const {data,error:signError}=await bucket.createSignedUrl(path,3600);
  if(signError)throw new Error(errorMessage(signError));
  return {id,path,url:data.signedUrl};
};
export async function signOut(){
  const {error}=await supabase.auth.signOut();
  if(error)throw new Error(errorMessage(error));
  location.href='./';
}
export async function loginForm({main,escape:e}){
  const session=await api('/api/session');
  main.innerHTML='<section class="wrap admin"><div class="box login-box"><span class="kicker">Autodeal 94</span><h1>Espace vendeur</h1>'+
    (session.signedIn?'<p>Ce compte n’est pas autorisé à gérer le catalogue.</p><button class="button" id="logout">Changer de compte</button>':
    '<p>Connectez-vous avec votre adresse vendeur.</p><form id="login-form"><label class="field">Adresse e-mail<input name="email" type="email" autocomplete="username" required></label><label class="field">Mot de passe<input name="password" type="password" autocomplete="current-password" minlength="8" required></label><button class="button" type="submit">Se connecter</button><button class="button light" id="register" type="button">Première connexion</button></form><p class="hint">Première connexion : choisissez un mot de passe, puis confirmez votre adresse avec l’e-mail reçu.</p>')+
    '<p id="login-feedback" role="status"></p></div></section>';
  if(session.signedIn){main.querySelector('#logout').onclick=signOut;return;}
  const form=main.querySelector('#login-form');
  async function submit(register){
    if(!form.reportValidity())return;
    const email=form.elements.email.value.trim(),password=form.elements.password.value;
    const feedback=main.querySelector('#login-feedback');
    form.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
      const response=register
        ? await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/?espace=vendeur'}})
        : await supabase.auth.signInWithPassword({email,password});
      if(response.error)throw new Error(errorMessage(response.error));
      if(response.data.session){location.reload();return;}
      feedback.textContent='Un e-mail de confirmation vous a été envoyé. Ouvrez-le, puis revenez vous connecter ici.';
    }catch(error){feedback.textContent=error.message;}
    finally{form.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  form.onsubmit=event=>{event.preventDefault();submit(false);};
  main.querySelector('#register').onclick=()=>submit(true);
}
