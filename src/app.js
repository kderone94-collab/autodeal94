'use strict';

import { sellerApp } from './seller.js';
import { api } from './data.js';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
let contactNumber = '';
let cars = [];
let current;
const params = new URLSearchParams(location.search);
const main = document.querySelector('main');
const dialog = document.querySelector('dialog');
const money = new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const integer = new Intl.NumberFormat('fr-FR');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusLabels={disponible:'Disponible',reserve:'Réservé',prochainement:'Prochainement disponible',vendu:'Vendu'};
const address='97 rue du Colonel Fabien, 94460 Valenton';
const picture = car => car.photos[0]?.url || '';
const whatsappMessage = car => params.get('service')==='mandataire' ? 'Bonjour, je suis intéressé par votre service de mandataire automobile. Pouvez-vous m’aider à trouver mon véhicule ?' : car
  ? car.status==='vendu' ? `Bonjour, votre ${car.name} (réf. ${car.ref}) est vendue. Avez-vous un véhicule similaire ?` : car.status==='prochainement' ? `Bonjour, je souhaite être informé de l’arrivée de votre ${car.name} (réf. ${car.ref}), prochainement disponible.` : `Bonjour, je suis intéressé par votre ${car.name} ${car.trim} (réf. ${car.ref}). Est-elle toujours disponible ?`
  : 'Bonjour, je suis intéressé par l’une de vos voitures. Pouvez-vous me renseigner ?';
const whatsappUrl = (message, number='') => 'https://wa.me/' + number.replace(/\D/g,'') + '?text=' + encodeURIComponent(message);
const whatsappButton = '<a href="#contact" class="button" data-contact="whatsapp">WhatsApp </a>';
const phoneButton = '<a href="#contact" class="button outline" data-contact="phone">Appeler</a>';

function photo(car, lazy = false) {
  return `<div class="photo status-${escape(car.status)}"><img ${lazy ? 'loading="lazy"' : ''} src="${picture(car)||'/img/hero.webp'}" alt="${escape(car.name)}" width="800" height="490"><span class="tag">${statusLabels[car.status]||'Disponible'}</span></div>`;
}
function card(car) {
  return `<a class="card vehicle-${escape(car.status)}" href="?vehicule=${encodeURIComponent(car.id)}">
    ${photo(car, true)}<div class="card-body"><span class="ref">Réf. ${escape(car.ref)}</span>
    <h3>${escape(car.name)}</h3><p>${escape(car.trim)}</p>
    <div class="chips"><span>${car.year||'Année à préciser'}</span><span>${car.km==null?'Kilométrage à préciser':integer.format(car.km)+' km'}</span><span>${escape(car.fuel)}</span><span>${escape(car.gearbox)}</span></div>
    <div class="card-bottom"><span class="price">${car.price?money.format(car.price):'Prix à venir'}</span><span>Voir la fiche</span></div></div></a>`;
}
function directions(){
  return `<div class="actions directions"><a class="button light" target="_blank" rel="noopener noreferrer" href="https://www.waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes">Itinéraire Waze ↗</a><a class="button light" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}">Google Maps ↗</a></div>`;
}
function contact() {
  return `<section class="contact" id="contact"><div class="wrap"><div><span class="kicker">Rencontrons-nous à Valenton</span><h2>Visiter notre parc automobile à Valenton</h2><p>Visites uniquement sur rendez-vous. Contactez-nous avant de vous déplacer.</p><address>${address}</address>${directions()}</div><div class="actions">${whatsappButton}<a class="button dark" href="#contact" data-contact="phone">Prendre rendez-vous</a></div></div></section>`;
}
function serviceCard(){
  return `<a class="card service-card" href="?service=mandataire"><div class="service-art"><span class="tag">Service sur mesure</span><span aria-hidden="true">↗</span><p>Vous cherchez.<br>Nous trouvons.</p></div><div class="card-body"><span class="ref">Mandataire automobile</span><h3>Mandataire automobile à Valenton</h3><p>Définissez vos critères et votre budget. Nous vous accompagnons dans la recherche de votre prochaine voiture.</p><div class="card-bottom"><strong>Parlons de votre projet</strong><span>Découvrir →</span></div></div></a>`;
}
function serviceDetail(){
  pageMetadata('Mandataire automobile à Valenton (94) | Autodeal 94','Confiez votre recherche de voiture à Autodeal 94, mandataire automobile à Valenton. Un accompagnement adapté à vos critères et à votre budget.','/?service=mandataire');
  main.innerHTML=`<section class="wrap detail service-detail"><a class="back" href="./#stock">Retour au catalogue</a><span class="kicker">Mandataire automobile</span><h1>Mandataire automobile<br><em>à Valenton</em></h1><p>Vous ne trouvez pas votre voiture dans notre parc ? Profitez de plus de 13 ans d’expérience pour être accompagné dans votre projet automobile.</p><div class="service-steps"><section class="box"><span class="ref">01 · Votre projet</span><h2>Définir vos critères</h2><p>Marque, modèle, usage, équipements et budget : nous échangeons sur vos priorités.</p></section><section class="box"><span class="ref">02 · Notre recherche</span><h2>Trouver les bonnes pistes</h2><p>Nous recherchons des véhicules correspondant à vos attentes et vous présentons les possibilités.</p></section><section class="box"><span class="ref">03 · Votre décision</span><h2>Avancer en confiance</h2><p>Nous précisons ensemble le périmètre de notre accompagnement et ses conditions avant tout engagement.</p></section></div><div class="actions">${whatsappButton}${phoneButton}</div></section>${contact()}`;
}
function pageMetadata(title,description,path='/'){
  document.title=title;
  document.querySelector('meta[name="description"]').content=description;
  document.querySelector('link[rel="canonical"]').href='https://autodeal94.vercel.app'+path;
  document.querySelector('meta[property="og:title"]').content=title;
  document.querySelector('meta[property="og:description"]').content=description;
}
function home() {
  pageMetadata('Voitures d’occasion à Valenton (94) | Autodeal 94','Autodeal 94 : voitures d’occasion inspectées à Valenton depuis 13 ans. Vente automobile, mandataire et Carte Grise. Visites uniquement sur rendez-vous.');
  main.innerHTML = `<section class="hero"><div class="wrap"><span class="kicker">Véhicules d’occasion · Val-de-Marne</span><h1>Voitures d’occasion<br><em>à Valenton, depuis 13 ans</em></h1><p>Des véhicules sélectionnés avec rigueur et inspectés par votre professionnel automobile dans le Val-de-Marne. Venez découvrir notre parc, uniquement sur rendez-vous.</p><div class="actions"><a href="#stock" class="button">Voir les véhicules </a><a href="#contact" class="button outline" data-contact="whatsapp">WhatsApp</a></div></div></section>
  <div class="ribbon"><div class="wrap"><span>Occasions multimarques</span><span>Visites uniquement sur rendez-vous</span><span>Véhicules inspectés</span></div></div>
  <section class="wrap trust" aria-labelledby="trust-title"><div class="trust-intro"><span class="kicker">Autodeal 94 · Val-de-Marne</span><h2 id="trust-title">Votre professionnel automobile à Valenton</h2><p>Depuis 13 ans, nous vous accompagnons dans l’achat de votre voiture avec un interlocuteur direct et des conseils adaptés à votre projet.</p></div><div class="trust-points"><div><span class="trust-number">01</span><div><h3>Une sélection rigoureuse</h3><p>Des véhicules sélectionnés avec soin et inspectés avant leur mise en vente.</p></div></div><div><span class="trust-number">02</span><div><h3>Un contact de proximité</h3><p>Un échange direct pour connaître le véhicule et préparer votre visite sur rendez-vous.</p></div></div><div><span class="trust-number">03</span><div><h3>Vos démarches accompagnées</h3><p>Un service Carte Grise et la recherche sur mesure de votre prochaine voiture.</p></div></div></div></section><section class="wrap stock" id="stock"><div class="stock-head"><div><span class="kicker">Le parc Autodeal 94</span><h2>Nos voitures d’occasion à vendre</h2></div><p class="count" id="count" aria-live="polite"></p></div>
  <form class="filters" role="search"><label>Rechercher<input name="search" type="search" placeholder="Modèle, marque ou référence"></label>
  <label>Disponibilité<select name="status"><option value="">Tout le catalogue</option><option value="disponible">Disponibles</option><option value="reserve">Réservés</option><option value="prochainement">Prochainement disponibles</option><option value="vendu">Vendus</option></select></label><label>Motorisation<select name="fuel"><option value="">Toutes</option><option>Essence</option><option>Diesel</option><option>Hybride</option><option>Hybride rechargeable</option><option>Électrique</option><option>GPL</option></select></label>
  <label>Transmission<select name="gearbox"><option value="">Toutes</option><option>Manuelle</option><option>Automatique</option></select></label>
  <label>Trier par<select name="sort"><option value="">Sélection</option><option value="price">Prix croissant</option><option value="km">Kilométrage</option><option value="year">Année récente</option></select></label>
  <button type="reset" class="button light">Réinitialiser</button></form><div id="grid"></div></section>${contact()}`;
  const form = main.querySelector('form');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function update() {
    const values = new FormData(form);
    const query = normalize(values.get('search').trim()).split(/\s+/);
    const results = cars.filter(car => {
      const text = normalize(`${car.name} ${car.trim} ${car.ref}`);
      return query.every(word => text.includes(word))
        && (!values.get('status') || car.status === values.get('status'))
        && (!values.get('fuel') || car.fuel === values.get('fuel'))
        && (!values.get('gearbox') || car.gearbox === values.get('gearbox'));
    });
    const sort = values.get('sort');
    if (sort) results.sort((a,b) => sort === 'year' ? b.year-a.year : a[sort]-b[sort]);
    main.querySelector('#count').textContent = results.length + (results.length === 1 ? ' véhicule' : ' véhicules') + '';
    const sections=[['disponible','Véhicules disponibles'],['reserve','Véhicules réservés'],['prochainement','Prochainement disponibles'],['vendu','Véhicules vendus']];
    const showService=!values.get('status')&&!values.get('fuel')&&!values.get('gearbox')&&query.every(word=>normalize('Mandataire automobile service recherche voiture sur mesure').includes(word));
    main.querySelector('#grid').innerHTML=sections.map(([status,title],i)=>{
      const group=results.filter(car=>car.status===status);
      if(!group.length&&!(i===0&&showService))return '';
      return '<section class="catalog-group" aria-label="'+title+'"><h3 class="group-title">'+title+'</h3><div class="grid">'+group.map(card).join('')+(i===0&&showService?serviceCard():'')+'</div></section>';
    }).join('')||'<p class="empty">Aucun véhicule ne correspond à ces critères.</p>';
  }
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  form.addEventListener('reset',() => queueMicrotask(update));
  form.addEventListener('submit',event => { event.preventDefault(); update(); });
  update();
}
function detail(car) {
  pageMetadata(`${car.name} ${car.year||''} d’occasion à Valenton | Autodeal 94`,`${car.name} ${car.trim||''}, ${car.year||'année à préciser'}, ${car.km==null?'kilométrage à préciser':integer.format(car.km)+' km'}. ${statusLabels[car.status]}. Découvrez ce véhicule chez Autodeal 94 à Valenton, sur rendez-vous.`, '/?vehicule='+encodeURIComponent(car.id));
  const facts = [['Année',car.year||'À préciser'],['Kilométrage',car.km==null?'À préciser':integer.format(car.km)+' km'],['Motorisation',car.fuel],['Transmission',car.gearbox],['Puissance',car.power],['Portes',car.doors]];
  main.innerHTML = `<section class="wrap detail"><a class="back" href="./#stock">Retour aux véhicules</a><div class="detail-layout">
  <div>${photo(car)}<div class="gallery">${car.photos.map((p,i)=>'<button type="button" data-gallery="'+i+'" aria-label="Voir la photo '+(i+1)+'"><img src="'+escape(p.url)+'" alt="" loading="lazy"></button>').join('')}</div><p class="notice">${car.photos.some(photo=>photo.id.startsWith('demo-')) ? 'Photo d’illustration · Véhicule de démonstration' : ''}</p><section class="box equipment"><h2>Présentation</h2><p class="description">${escape(car.description || '')}</p><h2>Équipements</h2><div class="chips">${car.extras.map(item => '<span>'+escape(item)+'</span>').join('')}</div></section></div>
  <section class="box"><span class="ref">Référence ${escape(car.ref)}</span><h1>${escape(car.name)}</h1><p class="muted">${escape(car.trim)}</p><p class="detail-status">${statusLabels[car.status]||'Disponible'}</p><p class="price">${car.price?money.format(car.price):'Prix à venir'}</p>
  <dl>${facts.map(([label,value]) => '<div><dt>'+label+'</dt><dd>'+escape(value)+'</dd></div>').join('')}</dl>
  <div class="actions">${whatsappButton}${phoneButton}</div></section></div></section>${contact()}`;
}

function contacts() {
  document.querySelectorAll('[data-contact]').forEach(link=>{
    const phone=link.dataset.contact==='phone';
    const message=whatsappMessage(current);
    if (contactNumber) {
      link.href=phone ? 'tel:'+contactNumber : whatsappUrl(message,contactNumber);
      if(!phone){link.target='_blank';link.rel='noopener noreferrer';}
      return;
    }
    link.addEventListener('click',event=>{
      event.preventDefault();
      document.querySelector('#dialog-body').innerHTML=phone
        ? '<h2>Contacter Autodeal 94</h2><p>Le numéro du vendeur sera communiqué prochainement.</p>'
        : '<h2>Message WhatsApp</h2><blockquote>'+escape(message)+'</blockquote><p>Le vendeur doit compléter son numéro dans son espace.</p>';
      dialog.showModal();
    });
  });
}
async function boot() {
  try {
    if(params.get('espace')==='vendeur'){
      document.querySelector('meta[name="robots"]').content='noindex,nofollow';
      await sellerApp({main,escape,money,api});
      return;
    }
    const data=await api('/api/vehicles');
    contactNumber=data.phone;
    cars=data.vehicles.map(car=>({...car,name:car.brand+' '+car.model}));
    current=cars.find(car=>car.id===params.get('vehicule') || car.ref===params.get('vehicule'));
    if(params.get('service')==='mandataire'){serviceDetail();}
    else if(current){
      detail(current);
      main.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{
        main.querySelector('.photo img').src=current.photos[Number(button.dataset.gallery)].url;
      }));
    }
    else if(params.has('vehicule')) main.innerHTML='<section class="wrap detail"><a class="back" href="./#stock">Retour aux véhicules</a><h2>Fiche indisponible</h2><p>Retrouvez les annonces disponibles dans le catalogue.</p></section>';
    else home();
    const mobileActions=document.createElement('div');mobileActions.className='mobile-contact';mobileActions.setAttribute('aria-label','Contacter Autodeal 94');mobileActions.innerHTML=phoneButton+whatsappButton;main.append(mobileActions);
    contacts();
    if(location.hash) requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
  } catch(error){
    main.innerHTML='<section class="wrap detail"><h2>Chargement indisponible</h2><p>'+escape(error.message)+'</p><button class="button" id="retry">Réessayer</button></section>';
    main.querySelector('#retry').addEventListener('click',boot);
  }
}
boot();
