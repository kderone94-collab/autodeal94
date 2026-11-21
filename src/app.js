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
const picture = car => car.photos[0]?.url || '';
const whatsappMessage = car => car
  ? `Bonjour, je suis intéressé par votre ${car.name} ${car.trim} (réf. ${car.ref}). Est-elle toujours disponible ?`
  : 'Bonjour, je suis intéressé par l’une de vos voitures. Pouvez-vous me renseigner ?';
const whatsappUrl = (message, number='') => 'https://wa.me/' + number.replace(/\D/g,'') + '?text=' + encodeURIComponent(message);
const whatsappButton = '<a href="#contact" class="button" data-contact="whatsapp">WhatsApp </a>';
const phoneButton = '<a href="#contact" class="button outline" data-contact="phone">Appeler</a>';

function photo(car, lazy = false) {
  return `<div class="photo"><img ${lazy ? 'loading="lazy"' : ''} src="${picture(car)}" alt="${escape(car.name)}" width="800" height="490"><span class="tag">${car.status === 'reserve' ? 'Réservé' : 'Disponible'}</span></div>`;
}
function card(car) {
  return `<a class="card" href="?vehicule=${encodeURIComponent(car.id)}">
    ${photo(car, true)}<div class="card-body"><span class="ref">Réf. ${escape(car.ref)}</span>
    <h3>${escape(car.name)}</h3><p>${escape(car.trim)}</p>
    <div class="chips"><span>${car.year}</span><span>${integer.format(car.km)} km</span><span>${escape(car.fuel)}</span><span>${escape(car.gearbox)}</span></div>
    <div class="card-bottom"><span class="price">${money.format(car.price)}</span><span>Voir la fiche</span></div></div></a>`;
}
function contact() {
  return `<section class="contact" id="contact"><div class="wrap"><div><span class="kicker">Val-de-Marne · 94</span><h2>On en parle ?</h2><p>Une question sur un véhicule ou envie de prévoir une visite ?</p></div><div class="actions">${whatsappButton}<a class="button dark" href="#contact" data-contact="phone">Appeler</a></div></div></section>`;
}
function home() {
  main.innerHTML = `<section class="hero"><div class="wrap"><span class="kicker">Véhicules d’occasion · Val-de-Marne</span><h1>Trouvez votre<br><em>prochaine auto.</em></h1><p>Explorez le parc Autodeal 94 et contactez-nous directement pour le véhicule qui vous intéresse.</p><div class="actions"><a href="#stock" class="button">Voir les véhicules </a><a href="#contact" class="button outline" data-contact="whatsapp">WhatsApp</a></div></div></section>
  <div class="ribbon"><div class="wrap"><span>Occasions multimarques</span><span>Visite sur rendez-vous</span><span>Contact direct</span></div></div>
  <section class="wrap stock" id="stock"><div class="stock-head"><div><span class="kicker">Le parc Autodeal 94</span><h2>Véhicules disponibles</h2></div><p class="count" id="count" aria-live="polite"></p></div>
  <form class="filters" role="search"><label>Rechercher<input name="search" type="search" placeholder="Modèle, marque ou référence"></label>
  <label>Motorisation<select name="fuel"><option value="">Toutes</option><option>Essence</option><option>Diesel</option><option>Hybride</option><option>Hybride rechargeable</option><option>Électrique</option><option>GPL</option></select></label>
  <label>Transmission<select name="gearbox"><option value="">Toutes</option><option>Manuelle</option><option>Automatique</option></select></label>
  <label>Trier par<select name="sort"><option value="">Sélection</option><option value="price">Prix croissant</option><option value="km">Kilométrage</option><option value="year">Année récente</option></select></label>
  <button type="reset" class="button light">Réinitialiser</button></form><div class="grid" id="grid"></div></section>${contact()}`;
  const form = main.querySelector('form');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function update() {
    const values = new FormData(form);
    const query = normalize(values.get('search').trim()).split(/\s+/);
    const results = cars.filter(car => {
      const text = normalize(`${car.name} ${car.trim} ${car.ref}`);
      return query.every(word => text.includes(word))
        && (!values.get('fuel') || car.fuel === values.get('fuel'))
        && (!values.get('gearbox') || car.gearbox === values.get('gearbox'));
    });
    const sort = values.get('sort');
    if (sort) results.sort((a,b) => sort === 'year' ? b.year-a.year : a[sort]-b[sort]);
    main.querySelector('#count').textContent = results.length + (results.length === 1 ? ' véhicule' : ' véhicules') + '';
    main.querySelector('#grid').innerHTML = results.map(card).join('') || '<p class="empty">Aucun véhicule ne correspond à ces critères.</p>';
  }
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  form.addEventListener('reset',() => queueMicrotask(update));
  form.addEventListener('submit',event => { event.preventDefault(); update(); });
  update();
}
function detail(car) {
  document.title = `${car.name} · ${car.ref} · Autodeal 94`;
  const facts = [['Année',car.year],['Kilométrage',integer.format(car.km)+' km'],['Motorisation',car.fuel],['Transmission',car.gearbox],['Puissance',car.power],['Portes',car.doors]];
  main.innerHTML = `<section class="wrap detail"><a class="back" href="./#stock">Retour aux véhicules</a><div class="detail-layout">
  <div>${photo(car)}<div class="gallery">${car.photos.map((p,i)=>'<button type="button" data-gallery="'+i+'" aria-label="Voir la photo '+(i+1)+'"><img src="'+escape(p.url)+'" alt="" loading="lazy"></button>').join('')}</div><p class="notice">${car.photos.some(photo=>photo.id.startsWith('demo-')) ? 'Photo d’illustration · Véhicule de démonstration' : ''}</p><section class="box equipment"><h2>Présentation</h2><p class="description">${escape(car.description || '')}</p><h2>Équipements</h2><div class="chips">${car.extras.map(item => '<span>'+escape(item)+'</span>').join('')}</div></section></div>
  <section class="box"><span class="ref">Référence ${escape(car.ref)}</span><h1>${escape(car.name)}</h1><p class="muted">${escape(car.trim)}</p><p class="price">${money.format(car.price)}</p>
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
      await sellerApp({main,escape,money,api});
      return;
    }
    const data=await api('/api/vehicles');
    contactNumber=data.phone;
    cars=data.vehicles.map(car=>({...car,name:car.brand+' '+car.model}));
    current=cars.find(car=>car.id===params.get('vehicule') || car.ref===params.get('vehicule'));
    if(current){
      detail(current);
      main.querySelectorAll('[data-gallery]').forEach(button=>button.addEventListener('click',()=>{
        main.querySelector('.photo img').src=current.photos[Number(button.dataset.gallery)].url;
      }));
    }
    else if(params.has('vehicule')) main.innerHTML='<section class="wrap detail"><a class="back" href="./#stock">Retour aux véhicules</a><h2>Fiche indisponible</h2><p>Retrouvez les annonces disponibles dans le catalogue.</p></section>';
    else home();
    contacts();
    if(location.hash) requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
  } catch(error){
    main.innerHTML='<section class="wrap detail"><h2>Chargement indisponible</h2><p>'+escape(error.message)+'</p><button class="button" id="retry">Réessayer</button></section>';
    main.querySelector('#retry').addEventListener('click',boot);
  }
}
boot();
