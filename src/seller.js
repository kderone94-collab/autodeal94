import { loginForm, signOut } from './data.js';
const labels={brouillon:'Brouillon',disponible:'Disponible',reserve:'Réservé',vendu:'Vendu',archive:'Archivé'};
const brands={
  Peugeot:['108','208','308','408','2008','3008','5008','Partner','Rifter'],
  Renault:['Clio','Captur','Mégane','Scénic','Austral','Arkana','Twingo','Kangoo'],
  Citroën:['C1','C3','C4','C5 Aircross','Berlingo'],
  Volkswagen:['Polo','Golf','Passat','T-Roc','Tiguan','Touran','ID.3'],
  Toyota:['Aygo','Yaris','Yaris Cross','Corolla','C-HR','RAV4'],
  BMW:['Série 1','Série 2','Série 3','Série 4','Série 5','X1','X3','X5'],
  Audi:['A1','A3 Sportback','A4','A5','A6','Q2','Q3','Q5'],
  'Mercedes-Benz':['Classe A','Classe B','Classe C','Classe E','GLA','GLB','GLC'],
  Dacia:['Sandero','Duster','Jogger','Spring'],Ford:['Fiesta','Focus','Puma','Kuga'],
  Fiat:['500','Panda','Tipo'],Kia:['Picanto','Rio','Ceed','Niro','Sportage'],
  Hyundai:['i10','i20','i30','Kona','Tucson'],Tesla:['Model 3','Model Y','Model S','Model X'],
  Nissan:['Micra','Juke','Qashqai','X-Trail'],Opel:['Corsa','Astra','Mokka','Crossland'],
  Seat:['Ibiza','Leon','Arona','Ateca'],Škoda:['Fabia','Octavia','Kamiq','Karoq','Kodiaq'],
  Volvo:['V40','V60','XC40','XC60','XC90'],Mini:['Mini','Clubman','Countryman'],
  Suzuki:['Swift','Vitara'],Mazda:['Mazda2','Mazda3','CX-3','CX-5'],
  Honda:['Jazz','Civic','HR-V','CR-V'],DS:['DS 3','DS 4','DS 7'],Porsche:['911','Macan','Cayenne','Panamera']
};
const standardEquipment=['ABS','ESP','Airbags','Apple CarPlay','Android Auto','Bluetooth','Navigation GPS','Écran tactile','Caméra de recul','Caméra 360°','Radar de recul','Radars avant et arrière','Climatisation','Climatisation automatique','Régulateur de vitesse','Régulateur adaptatif','Limiteur de vitesse','Feux LED','Feux automatiques','Détecteur de pluie','Jantes alliage','Toit ouvrant','Toit panoramique','Sièges chauffants','Sièges électriques','Sellerie cuir','Accès et démarrage sans clé','Aide au maintien dans la voie','Freinage automatique d’urgence','Attelage','Rétroviseurs rabattables','Vitres électriques','Roue de secours'];
const types=['Citadine','Berline','SUV / 4x4','Break','Coupé','Cabriolet','Monospace','Utilitaire'];
const fuels=['Essence','Diesel','Hybride','Hybride rechargeable','Électrique','GPL'];
export async function sellerApp({main,escape:e,money,api}){
  document.title='Espace vendeur · Autodeal 94';
  const session=await api('/api/session');
  if(!session.seller){
    await loginForm({main,escape:e});
    return;
  }
  let vehicles=[], equipment=[], phone='', selectedPhotos=[], selectedExtras=[], formDirty=false, saving=false;
  let activeVehicle=null;
  const unload=event=>{if(formDirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',unload);
  async function load(){const data=await api('/api/admin/vehicles');vehicles=data.vehicles;equipment=data.equipment;phone=data.phone;}
  function shell(content){
    main.innerHTML='<div class="wrap seller"><div class="seller-top"><a href="./">Voir le site</a><button type="button" class="text-button" id="logout">Se déconnecter</button></div>'+content+'</div>';
    main.querySelector('#logout').onclick=signOut;
    window.scrollTo({top:0,behavior:'instant'});
  }
  function alertBox(message){const el=main.querySelector('#feedback');if(el){el.textContent=message;el.focus();}}
  function buttonsBusy(form,busy){form.querySelectorAll('button,input,select,textarea').forEach(control=>control.disabled=busy);}
  async function dashboard(message=''){
    formDirty=false; activeVehicle=null;
    await load();
    const counts=Object.fromEntries(Object.keys(labels).map(key=>[key,vehicles.filter(car=>car.status===key).length]));
    shell('<div class="seller-heading"><div><span class="kicker">Gestion du parc</span><h1>Vos véhicules</h1><p class="muted">Ajoutez une annonce ou mettez à jour votre catalogue.</p></div><button class="button" id="add">Ajouter un véhicule</button></div>'+
      '<div class="seller-stats"><span><strong>'+vehicles.length+'</strong> annonces</span><span><strong>'+counts.disponible+'</strong> disponibles</span><span><strong>'+counts.brouillon+'</strong> brouillons</span><span><strong>'+counts.reserve+'</strong> réservés</span></div>'+
      '<p id="feedback" tabindex="-1" role="status">'+e(message)+'</p>'+
      '<div class="seller-toolbar"><label class="field">Rechercher<input id="seller-search" type="search" placeholder="Marque, modèle ou référence"></label><label class="field">Statut<select id="seller-status"><option value="">Tous les statuts</option>'+Object.entries(labels).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label></div>'+
      '<div id="seller-list" class="seller-list"></div>'+
      '<details class="box seller-settings"><summary>Coordonnées et exemples</summary><form id="phone-form"><label class="field">Téléphone et WhatsApp<input name="phone" type="tel" placeholder="+33612345678" value="'+e(phone)+'"></label><p class="muted">Le même numéro est utilisé pour les appels et WhatsApp.</p><button class="button light">Enregistrer le numéro</button><p id="phone-status" role="status"></p></form>'+
      '<div class="demo-import"><h3>Véhicules d’exemple</h3><p class="muted">Importez les six annonces de la maquette pour découvrir le fonctionnement.</p><button id="demo" class="button light">Importer les exemples</button></div></details>');
    main.querySelector('#add').onclick=()=>edit();
    const list=main.querySelector('#seller-list');
    function render(){
      const q=main.querySelector('#seller-search').value.toLocaleLowerCase('fr');
      const status=main.querySelector('#seller-status').value;
      const results=vehicles.filter(car=>(!status || car.status===status)&&(car.brand+' '+car.model+' '+car.ref).toLocaleLowerCase('fr').includes(q));
      list.innerHTML=results.map(car=>'<article class="seller-car">'+(car.photos[0]?'<img src="'+e(car.photos[0].url)+'" alt="'+e(car.brand+' '+car.model)+'">':'<div class="no-photo">Photo à ajouter</div>')+
        '<div class="seller-car-info"><span class="ref">'+e(car.ref)+'</span><h3>'+e(car.brand+' '+car.model)+'</h3><p class="muted">'+e(car.trim)+'</p><p>'+e(car.year??'Année à compléter')+' · '+(car.km===null?'Kilométrage à compléter':new Intl.NumberFormat('fr-FR').format(car.km)+' km')+'</p><span class="status status-'+car.status+'">'+labels[car.status]+'</span></div>'+
        '<div class="seller-car-actions"><strong class="price">'+(car.price?money.format(car.price):'Prix à compléter')+'</strong><button class="button light" data-edit="'+car.id+'">Modifier</button><label class="field">Statut<select data-status="'+car.id+'" aria-label="Statut de '+e(car.ref)+'">'+Object.entries(labels).map(([v,l])=>'<option value="'+v+'" '+(v===car.status?'selected':'')+'>'+l+'</option>').join('')+'</select></label><button class="text-button danger" data-delete="'+car.id+'">Supprimer</button></div></article>').join('') || '<section class="empty"><h3>'+(!vehicles.length?'Votre parc est prêt':'Aucune annonce trouvée')+'</h3><p>'+(!vehicles.length?'Ajoutez votre premier véhicule pour commencer.':'Modifiez les critères de recherche.')+'</p></section>';
      list.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>edit(vehicles.find(car=>car.id===button.dataset.edit)));
      list.querySelectorAll('[data-status]').forEach(select=>select.onchange=async()=>{
        select.disabled=true;
        const car=vehicles.find(car=>car.id===select.dataset.status);
        try{await api('/api/admin/vehicles/'+car.id,{method:'PUT',body:JSON.stringify({...car,status:select.value})});await dashboard('Statut enregistré.');}
        catch(error){select.disabled=false;select.value=car.status;alertBox(error.message);}
      });
      list.querySelectorAll('[data-delete]').forEach(button=>button.onclick=()=>remove(vehicles.find(car=>car.id===button.dataset.delete)));
    }
    main.querySelector('#seller-search').oninput=render;
    main.querySelector('#seller-status').onchange=render;
    main.querySelector('#phone-form').onsubmit=async event=>{
      event.preventDefault();const form=event.currentTarget;buttonsBusy(form,true);
      try{await api('/api/admin/settings',{method:'PUT',body:JSON.stringify({phone:form.elements.phone.value.trim()})});main.querySelector('#phone-status').textContent='Numéro enregistré.';}
      catch(error){main.querySelector('#phone-status').textContent=error.message;}
      finally{buttonsBusy(form,false);}
    };
    main.querySelector('#demo').onclick=async event=>{
      event.currentTarget.disabled=true;
      try{await api('/api/admin/import-demo',{method:'POST',body:'{}'});await dashboard('Les exemples sont disponibles dans le catalogue.');}
      catch(error){alertBox(error.message);event.target.disabled=false;}
    };
    render();
  }
  async function remove(car){
    const modal=document.createElement('dialog');
    modal.innerHTML='<h2>Supprimer cette annonce ?</h2><p>'+e(car.brand+' '+car.model)+' · '+e(car.ref)+'</p><p>Elle sera retirée du catalogue et de votre liste.</p><div class="actions"><button class="button light" id="cancel-delete">Annuler</button><button class="button delete-button" id="confirm-delete">Supprimer l’annonce</button></div><p role="status"></p>';
    document.body.append(modal);modal.showModal();
    modal.addEventListener('close',()=>modal.remove());
    modal.querySelector('#cancel-delete').onclick=()=>modal.close();
    modal.querySelector('#confirm-delete').onclick=async()=>{
      modal.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await api('/api/admin/vehicles/'+car.id,{method:'DELETE',body:JSON.stringify({revision:car.revision})});modal.close();await dashboard('Annonce supprimée.');}
      catch(error){modal.querySelector('p[role]').textContent=error.message;modal.querySelectorAll('button').forEach(b=>b.disabled=false);}
    };
  }
  function edit(car){
    activeVehicle=car||null;formDirty=false;selectedPhotos=(car?.photos||[]).map(p=>({...p}));selectedExtras=[...(car?.extras||[])];
    const requestId=crypto.randomUUID();
    const input=(name,label,opts='')=>'<label class="field">'+label+'<input name="'+name+'" '+opts+' value="'+e(car?.[name]??'')+'"></label>';
    const select=(name,label,options)=>'<label class="field">'+label+'<select name="'+name+'"><option value="">Sélectionner</option>'+options.map(value=>'<option '+(value===car?.[name]?'selected':'')+'>'+e(value)+'</option>').join('')+'</select></label>';
    shell('<button class="text-button" id="back-list">Retour aux véhicules</button><div class="seller-heading"><div><span class="kicker">'+(car?e(car.ref):'Nouvelle annonce')+'</span><h1>'+(car?'Modifier le véhicule':'Ajouter un véhicule')+'</h1></div></div>'+
      (car?.pendingPhotoCount?'<p class="migration-note">Une photo de cette annonce doit être réimportée après le transfert. Ajoutez-la dans la section Photos avant de publier.</p>':'')+
      '<form id="vehicle-form" class="vehicle-form" novalidate><div class="wizard-progress" aria-label="Progression"><p id="step-label" aria-live="polite"></p><progress id="step-progress" max="5" value="1"></progress></div><div class="editor-main">'+
      '<section class="box wizard-step" data-step="0"><h2 tabindex="-1">Le véhicule</h2><div class="form-grid">'+
      input('brand','Marque *','required list="brands" maxlength="60" autocomplete="off"')+input('model','Modèle *','required list="models" maxlength="100" autocomplete="off"')+
      input('trim','Version / finition','maxlength="150" placeholder="1.2 PureTech 100 Allure"')+select('type','Type de véhicule',types)+
      input('year','Année','type="number" min="1900" max="'+(new Date().getFullYear()+1)+'" placeholder="2021"')+input('km','Kilométrage (km)','type="number" min="0" max="2000000" placeholder="48700"')+
      select('fuel','Motorisation',fuels)+select('gearbox','Boîte de vitesses',['Manuelle','Automatique'])+
      input('power','Puissance','maxlength="30" placeholder="100 ch"')+select('doors','Nombre de portes',['2','3','4','5','6','7'])+
      input('color','Couleur extérieure','list="colors" maxlength="60"')+input('interior','Intérieur','maxlength="60" placeholder="Tissu noir"')+
      input('plate','Immatriculation privée','maxlength="15" placeholder="AA-123-AA"')+'</div><p class="hint">L’immatriculation est visible uniquement dans l’espace vendeur. Les caractéristiques se renseignent ici manuellement.</p></section>'+
      '<section class="box wizard-step" data-step="1" hidden><div class="section-heading"><h2 tabindex="-1">Photos</h2><span id="photo-count">0 / 20</span></div>'+
      '<label class="upload-zone" id="upload-zone"><strong>Ajouter des photos</strong><span>Sélectionnez plusieurs images ou glissez-les ici</span><span class="hint">JPEG, PNG, WebP · 20 photos maximum</span><input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>'+
      '<p id="upload-status" role="status"></p><div id="photos" class="photo-editor"></div><p class="hint">La première photo est la couverture. Déplacez les photos avec les boutons ou par glisser-déposer.</p></section>'+
      '<section class="box wizard-step" data-step="2" hidden><h2 tabindex="-1">Équipements et options</h2><label class="field">Rechercher ou créer un équipement<input id="equipment-input" type="text" list="equipment-list" placeholder="Caméra de recul, CarPlay…" maxlength="100" autocomplete="off"></label><div class="option-add"><button type="button" class="button light" id="add-equipment">Ajouter l’équipement</button><span class="hint">Validez aussi avec Entrée.</span></div><datalist id="equipment-list"></datalist><div id="extras" class="equipment-chips"></div></section>'+
      '<section class="box wizard-step" data-step="3" hidden><h2 tabindex="-1">Prix et description</h2>'+input('price','Prix de vente (€)','type="number" min="1" max="10000000" placeholder="11990"')+
      '<label class="field">Description<textarea name="description" rows="6" maxlength="10000" placeholder="État général, entretien, points forts…">'+e(car?.description||'')+'</textarea></label></section>'+
      '<section class="box publish-panel wizard-step" data-step="4" hidden><h2 tabindex="-1">Vérifier et publier</h2><div id="mini-preview"></div><p class="hint">Pour publier, ajoutez au moins une photo et complétez les caractéristiques et le prix.</p><label class="field">Statut après enregistrement<select name="status">'+Object.entries(labels).map(([value,label])=>'<option value="'+value+'" '+(value===(car?.status||'brouillon')?'selected':'')+'>'+label+'</option>').join('')+'</select></label><button type="submit" class="button" id="save">Enregistrer ce statut</button><button type="button" class="button light" id="publish">Publier l’annonce</button><p class="hint">Les modifications enregistrées sont partagées entre vos appareils.</p></section></div><p id="feedback" role="status" tabindex="-1"></p><div class="wizard-actions"><button type="button" class="button light" id="step-prev">Précédent</button><button type="button" class="button" id="step-next">Continuer</button><button type="submit" class="text-button" id="save-draft">Enregistrer un brouillon</button><p class="hint">Votre saisie reste disponible pendant le passage d’une étape à l’autre. Enregistrez pour la retrouver sur un autre appareil.</p></div></form>'+
      '<datalist id="brands">'+Object.keys(brands).map(b=>'<option value="'+e(b)+'">').join('')+'</datalist><datalist id="models"></datalist><datalist id="colors">'+['Noir','Blanc','Gris','Argent','Bleu','Rouge','Vert','Beige','Marron','Orange','Jaune'].map(c=>'<option value="'+c+'">').join('')+'</datalist>');
    const form=main.querySelector('#vehicle-form'), photoInput=main.querySelector('#photo-input');
    const steps=[...form.querySelectorAll('[data-step]')];
    const stepNames=['Le véhicule','Les photos','Les équipements','Prix et description','Vérifier et publier'];
    let currentStep=0;
    function showStep(index,focus=true){
      if(uploading||saving){alertBox('Attendez la fin de l’envoi ou de l’enregistrement.');return;}
      currentStep=index;
      steps.forEach((section,i)=>section.hidden=i!==index);
      form.querySelector('#step-label').textContent='Étape '+(index+1)+' sur 5 · '+stepNames[index];
      form.querySelector('#step-progress').value=index+1;
      form.querySelector('#step-prev').hidden=index===0;
      form.querySelector('#step-next').hidden=index===4;
      if(focus){steps[index].querySelector('h2').focus();steps[index].scrollIntoView({block:'start',behavior:'smooth'});}
    }
    function validateFields(fields){
      for(const field of fields){
        if(!field.checkValidity()){
          const section=field.closest('[data-step]');
          if(section)showStep(Number(section.dataset.step),false);
          field.focus();field.reportValidity();return false;
        }
      }
      return true;
    }
    form.querySelector('#step-prev').onclick=()=>showStep(currentStep-1);
    form.querySelector('#step-next').onclick=()=>{
      if(validateFields(steps[currentStep].querySelectorAll('input[name],select[name],textarea[name]'))){
        if(currentStep===2)addPendingEquipment();
        showStep(currentStep+1);
      }
    };
    // Native select values are strings, including doors.
    if(car?.doors) form.elements.doors.value=String(car.doors);
    const suggest=()=>{main.querySelector('#models').innerHTML=(brands[form.elements.brand.value]||[]).map(m=>'<option value="'+e(m)+'">').join('');};
    form.elements.brand.addEventListener('input',suggest);suggest();
    main.querySelector('#back-list').onclick=()=>{if(uploading || saving){alertBox('Attendez la fin de l’envoi ou de l’enregistrement.');return;}if(!formDirty || confirm('Quitter sans enregistrer les modifications ?')) dashboard();};
    function preview(){
      main.querySelector('#mini-preview').innerHTML=(selectedPhotos[0]?'<img src="'+e(selectedPhotos[0].url)+'" alt="Photo de couverture">':'<div class="no-photo">Photo de couverture</div>')+
      '<h3>'+e((form.elements.brand.value+' '+form.elements.model.value).trim()||'Votre véhicule')+'</h3><p>'+e(form.elements.trim.value)+'</p><strong class="price">'+(Number(form.elements.price.value)>0?money.format(Number(form.elements.price.value)):'Prix à compléter')+'</strong>';
    }
    form.oninput=()=>{formDirty=true;preview();};
    function renderExtras(){
      main.querySelector('#extras').innerHTML=selectedExtras.map((value,i)=>'<button class="equipment-chip" type="button" data-remove-extra="'+i+'" aria-label="Retirer '+e(value)+'">'+e(value)+' <span aria-hidden="true">×</span></button>').join('');
      main.querySelector('#equipment-list').innerHTML=[...new Set([...standardEquipment,...equipment])].filter(value=>!selectedExtras.some(selected=>selected.toLocaleLowerCase('fr')===value.toLocaleLowerCase('fr'))).map(value=>'<option value="'+e(value)+'">').join('');
      main.querySelectorAll('[data-remove-extra]').forEach(button=>button.onclick=()=>{selectedExtras.splice(Number(button.dataset.removeExtra),1);formDirty=true;renderExtras();});
    }
    const optionInput=main.querySelector('#equipment-input');
    function addExtra(){
      const value=optionInput.value.trim();
      if(!value)return;
      if(selectedExtras.length>=100){alertBox('Maximum 100 équipements.');return;}
      if(!selectedExtras.some(item=>item.toLocaleLowerCase('fr')===value.toLocaleLowerCase('fr')))selectedExtras.push(value);
      optionInput.value='';formDirty=true;renderExtras();optionInput.focus();
    }
    main.querySelector('#add-equipment').onclick=addExtra;
    optionInput.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();addExtra();}};
    function renderPhotos(){
      main.querySelector('#photo-count').textContent=selectedPhotos.length+' / 20';
      main.querySelector('#photos').innerHTML=selectedPhotos.map((photo,i)=>'<div class="photo-tile" draggable="true" data-photo="'+i+'"><img src="'+e(photo.url)+'" alt="Photo '+(i+1)+'">'+
      '<span class="photo-position">'+(i===0?'Couverture':'Photo '+(i+1))+'</span><div class="photo-tools"><button type="button" data-photo-left="'+i+'" '+(i===0?'disabled':'')+' aria-label="Avancer la photo '+(i+1)+'">Avant</button><button type="button" data-photo-right="'+i+'" '+(i===selectedPhotos.length-1?'disabled':'')+' aria-label="Reculer la photo '+(i+1)+'">Après</button><button type="button" data-photo-delete="'+i+'" aria-label="Retirer la photo '+(i+1)+'">Retirer</button></div></div>').join('');
      main.querySelectorAll('[data-photo-left]').forEach(button=>button.onclick=()=>move(Number(button.dataset.photoLeft),Number(button.dataset.photoLeft)-1));
      main.querySelectorAll('[data-photo-right]').forEach(button=>button.onclick=()=>move(Number(button.dataset.photoRight),Number(button.dataset.photoRight)+1));
      main.querySelectorAll('[data-photo-delete]').forEach(button=>button.onclick=()=>{selectedPhotos.splice(Number(button.dataset.photoDelete),1);formDirty=true;renderPhotos();});
      main.querySelectorAll('[data-photo]').forEach(tile=>{
        tile.ondragstart=event=>event.dataTransfer.setData('text/plain',tile.dataset.photo);
        tile.ondragover=event=>event.preventDefault();
        tile.ondrop=event=>{event.preventDefault();const from=Number(event.dataTransfer.getData('text/plain'));if(Number.isInteger(from)&&from>=0&&from<selectedPhotos.length)move(from,Number(tile.dataset.photo));};
      });
      preview();
    }
    function move(from,to){if(to<0||to>=selectedPhotos.length)return;selectedPhotos.splice(to,0,selectedPhotos.splice(from,1)[0]);formDirty=true;renderPhotos();}
    let uploading=false;
    async function upload(files){
      if(uploading || saving)return;
      const batch=Array.from(files);
      const feedback=main.querySelector('#upload-status');
      if(selectedPhotos.length+batch.length>20){feedback.textContent='Vous pouvez ajouter encore '+(20-selectedPhotos.length)+' photo(s). Sélectionnez moins de fichiers.';return;}
      if(!batch.length)return;
      uploading=true;form.querySelector('#save-draft').disabled=true;photoInput.disabled=true;main.querySelector('#save').disabled=true;main.querySelector('#publish').disabled=true;
      const failures=[];
      for(let i=0;i<batch.length;i++){
        feedback.textContent='Préparation et envoi de la photo '+(i+1)+' sur '+batch.length+'…';
        try{
          const blob=await compress(batch[i]);
          const data={photo:await api.uploadPhoto(blob)};
          selectedPhotos.push(data.photo);formDirty=true;renderPhotos();
        }catch(error){failures.push(batch[i].name+' — '+error.message);}
      }
      uploading=false;form.querySelector('#save-draft').disabled=false;photoInput.disabled=false;photoInput.value='';main.querySelector('#save').disabled=false;main.querySelector('#publish').disabled=false;
      feedback.textContent=failures.length ? failures.join(' · ')+'. Sélectionnez de nouveau ces photos pour réessayer.' : batch.length+' photo(s) ajoutée(s).';
    }
    photoInput.onchange=()=>upload(photoInput.files);
    const drop=main.querySelector('#upload-zone');
    drop.ondragover=event=>{event.preventDefault();drop.classList.add('drag-over');};
    drop.ondragleave=()=>drop.classList.remove('drag-over');
    drop.ondrop=event=>{event.preventDefault();drop.classList.remove('drag-over');upload(event.dataTransfer.files);};
    main.querySelector('#publish').onclick=()=>{form.elements.status.value='disponible';form.requestSubmit(form.querySelector('#save'));};
    form.onsubmit=async event=>{
      event.preventDefault();if(uploading || saving)return;
      if(!event.submitter && currentStep<4){form.querySelector('#step-next').click();return;}
      if(!validateFields(form.querySelectorAll('input[name],select[name],textarea[name]')))return;
      addPendingEquipment();
      const values=Object.fromEntries(new FormData(form));
      if(event.submitter?.id==='save-draft')values.status='brouillon';
      if(['disponible','reserve'].includes(values.status)){
        if(!values.year||values.km===''||!values.price||!values.type||!values.fuel||!values.gearbox||!selectedPhotos.length){alertBox('Pour publier, complétez l’année, le kilométrage, le prix, le type, la motorisation, la boîte et ajoutez au moins une photo.');return;}
      }
      saving=true;buttonsBusy(form,true);
      const payload={...values,photos:selectedPhotos,extras:selectedExtras,requestId,revision:activeVehicle?.revision};
      try{
        const response=await api('/api/admin/vehicles'+(activeVehicle?'/'+activeVehicle.id:''),{method:activeVehicle?'PUT':'POST',body:JSON.stringify(payload)});
        activeVehicle=response.vehicle;formDirty=false;
        await dashboard(values.status==='disponible'?'Annonce publiée dans le catalogue.':'Annonce enregistrée.');
      }catch(error){alertBox(error.message);}
      finally{saving=false;if(form.isConnected)buttonsBusy(form,false);}
    };
    function addPendingEquipment(){if(optionInput.value.trim())addExtra();}
    renderExtras();renderPhotos();showStep(0,false);
  }
  async function compress(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choisissez une image JPEG, PNG ou WebP.');
    if(file.size>40*1024*1024)throw new Error('Fichier supérieur à 40 Mo.');
    const bitmap=await createImageBitmap(file);
    try{
      const scale=Math.min(1,1800/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      const context=canvas.getContext('2d');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84));
      if(!blob)throw new Error('Conversion de la photo impossible.');
      return blob;
    }finally{bitmap.close();}
  }
  await dashboard();
}
