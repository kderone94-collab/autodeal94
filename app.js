'use strict';

// Utiliser un numéro au format international, par exemple +33…
// La valeur vide active la démonstration sans destinataire fictif.
const contactNumber = '';
const stock = [
  {id:'AD94-001', name:'Peugeot 208', trim:'1.2 PureTech 100 Allure', year:2021, km:48700, fuel:'Essence', gearbox:'Manuelle', price:11990, image:'208', power:'100 ch', doors:5, extras:['Apple CarPlay', 'Radar de recul', 'Climatisation automatique']},
  {id:'AD94-002', name:'Renault Clio', trim:'TCe 90 Intens', year:2021, km:53200, fuel:'Essence', gearbox:'Manuelle', price:10990, image:'clio', power:'90 ch', doors:5, extras:['Écran tactile', 'Bluetooth', 'Régulateur de vitesse']},
  {id:'AD94-003', name:'Volkswagen Golf', trim:'1.5 eTSI 150 DSG Life', year:2021, km:68900, fuel:'Hybride', gearbox:'Automatique', price:18990, image:'golf', power:'150 ch', doors:5, extras:['Cockpit numérique', 'Régulateur adaptatif', 'Apple CarPlay']},
  {id:'AD94-004', name:'Toyota Yaris', trim:'116h Design', year:2021, km:41300, fuel:'Hybride', gearbox:'Automatique', price:15490, image:'yaris', power:'116 ch', doors:5, extras:['Caméra de recul', 'Apple CarPlay', 'Climatisation automatique']},
  {id:'AD94-005', name:'BMW Série 1', trim:'118i 140 Sport', year:2020, km:62700, fuel:'Essence', gearbox:'Automatique', price:19990, image:'bmw', power:'140 ch', doors:5, extras:['Radar de recul', 'Navigation', 'Feux LED']},
  {id:'AD94-006', name:'Audi A3 Sportback', trim:'30 TDI 116 S line', year:2021, km:73500, fuel:'Diesel', gearbox:'Manuelle', price:21990, image:'a3', power:'116 ch', doors:5, extras:['Cockpit numérique', 'Feux LED', 'Aide au stationnement']}
];
const storageKey = 'autodeal94.demo.stock.v1';
function readLocal() {
  try {
    const entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(entries) ? entries : [];
  } catch { return []; }
}
const cars = stock.concat(readLocal());
const params = new URLSearchParams(location.search);
const current = cars.find(car => car.id === params.get('vehicule'));
const main = document.querySelector('main');
const dialog = document.querySelector('dialog');
const money = new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const integer = new Intl.NumberFormat('fr-FR');
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const picture = car => 'img/' + stock.find(item => item.image === car.image)?.image + '.webp';
const whatsappMessage = car => car
  ? `Bonjour, je suis intéressé par votre ${car.name} ${car.trim} (réf. ${car.id}). Est-elle toujours disponible ?`
  : 'Bonjour, je suis intéressé par l’une de vos voitures. Pouvez-vous me renseigner ?';
const whatsappUrl = (message, number='') => 'https://wa.me/' + number.replace(/\D/g,'') + '?text=' + encodeURIComponent(message);
const whatsappButton = '<a href="#contact" class="button" data-contact="whatsapp">WhatsApp <span aria-hidden="true">→</span></a>';
const phoneButton = '<a href="#contact" class="button outline" data-contact="phone">Appeler</a>';

function photo(car, lazy = false) {
  return `<div class="photo"><img ${lazy ? 'loading="lazy"' : ''} src="${picture(car)}" alt="${escape(car.name)} — photo d’illustration" width="800" height="490"><span class="tag">Disponible</span></div>`;
}
function card(car) {
  return `<a class="card" href="?vehicule=${encodeURIComponent(car.id)}">
    ${photo(car, true)}<div class="card-body"><span class="ref">Réf. ${escape(car.id)}</span>
    <h3>${escape(car.name)}</h3><p>${escape(car.trim)}</p>
    <div class="chips"><span>${car.year}</span><span>${integer.format(car.km)} km</span><span>${escape(car.fuel)}</span><span>${escape(car.gearbox)}</span></div>
    <div class="card-bottom"><span class="price">${money.format(car.price)}</span><span>Voir la fiche →</span></div></div></a>`;
}
function contact() {
  return `<section class="contact" id="contact"><div class="wrap"><div><span class="kicker">Val-de-Marne · 94</span><h2>On en parle ?</h2><p>Une question sur un véhicule ou envie de prévoir une visite ?</p></div><div class="actions">${whatsappButton}<a class="button dark" href="#contact" data-contact="phone">Appeler</a></div></div></section>`;
}
function home() {
  main.innerHTML = `<section class="hero"><div class="wrap"><span class="kicker">Véhicules d’occasion · Val-de-Marne</span><h1>Trouvez votre<br><em>prochaine auto.</em></h1><p>Explorez le parc Autodeal 94 et contactez-nous directement pour le véhicule qui vous intéresse.</p><div class="actions"><a href="#stock" class="button">Voir les véhicules <span aria-hidden="true">↓</span></a><a href="#contact" class="button outline" data-contact="whatsapp">WhatsApp →</a></div></div></section>
  <div class="ribbon"><div class="wrap"><span>Occasions multimarques</span><span>Visite sur rendez-vous</span><span>Contact direct</span></div></div>
  <section class="wrap stock" id="stock"><div class="stock-head"><div><span class="kicker">Le parc Autodeal 94</span><h2>Véhicules disponibles</h2></div><p class="count" id="count" aria-live="polite"></p></div>
  <form class="filters" role="search"><label>Rechercher<input name="search" type="search" placeholder="Modèle, marque ou référence"></label>
  <label>Motorisation<select name="fuel"><option value="">Toutes</option><option>Essence</option><option>Diesel</option><option>Hybride</option></select></label>
  <label>Transmission<select name="gearbox"><option value="">Toutes</option><option>Manuelle</option><option>Automatique</option></select></label>
  <label>Trier par<select name="sort"><option value="">Sélection</option><option value="price">Prix croissant</option><option value="km">Kilométrage</option><option value="year">Année récente</option></select></label>
  <button type="reset" class="button light">Réinitialiser</button></form><div class="grid" id="grid"></div></section>${contact()}`;
  const form = main.querySelector('form');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function update() {
    const values = new FormData(form);
    const query = normalize(values.get('search').trim()).split(/\s+/);
    const results = cars.filter(car => {
      const text = normalize(`${car.name} ${car.trim} ${car.id}`);
      return query.every(word => text.includes(word))
        && (!values.get('fuel') || car.fuel === values.get('fuel'))
        && (!values.get('gearbox') || car.gearbox === values.get('gearbox'));
    });
    const sort = values.get('sort');
    if (sort) results.sort((a,b) => sort === 'year' ? b.year-a.year : a[sort]-b[sort]);
    main.querySelector('#count').textContent = results.length + (results.length === 1 ? ' véhicule' : ' véhicules') + ' · Parc de démonstration';
    main.querySelector('#grid').innerHTML = results.map(card).join('') || '<p class="empty">Aucun véhicule ne correspond à ces critères.</p>';
  }
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  form.addEventListener('reset',() => queueMicrotask(update));
  form.addEventListener('submit',event => { event.preventDefault(); update(); });
  update();
}
function detail(car) {
  document.title = `${car.name} · ${car.id} · Autodeal 94`;
  const facts = [['Année',car.year],['Kilométrage',integer.format(car.km)+' km'],['Motorisation',car.fuel],['Transmission',car.gearbox],['Puissance',car.power],['Portes',car.doors]];
  main.innerHTML = `<section class="wrap detail"><a class="back" href="./#stock">← Retour aux véhicules</a><div class="detail-layout">
  <div>${photo(car)}<p class="notice">Photo d’illustration · Véhicule de démonstration</p><section class="box equipment"><h2>Équipements</h2><div class="chips">${car.extras.map(item => '<span>'+escape(item)+'</span>').join('')}</div></section></div>
  <section class="box"><span class="ref">Référence ${escape(car.id)}</span><h1>${escape(car.name)}</h1><p class="muted">${escape(car.trim)}</p><p class="price">${money.format(car.price)}</p>
  <dl>${facts.map(([label,value]) => '<div><dt>'+label+'</dt><dd>'+escape(value)+'</dd></div>').join('')}</dl>
  <div class="actions">${whatsappButton}${phoneButton}</div></section></div></section>${contact()}`;
}
function admin() {
  document.title = 'Espace vendeur démo · Autodeal 94';
  main.innerHTML = `<section class="wrap admin"><a class="back" href="./#stock">← Retour au parc</a><span class="kicker">Espace vendeur · Démonstration</span><h1>Ajouter un véhicule</h1>
  <p class="muted">Testez le parcours de saisie. Les ajouts restent dans ce navigateur.</p>
  <section class="box"><form id="plate-form"><label class="field">Immatriculation de test<input name="plate" required maxlength="12" placeholder="DE-094-MO" autocomplete="off"></label>
  <div class="actions"><button class="button" type="submit">Rechercher par plaque</button><button class="button light" type="button" id="example">Utiliser la plaque d’exemple</button></div><p id="plate-status" aria-live="polite">Plaque fictive prise en charge pour la démo : DE-094-MO.</p></form></section>
  <section class="box" id="listing-box" hidden><form id="listing-form"><h3>Préparer l’annonce</h3>
    <div class="form-grid"><label class="field">Marque et modèle<input name="model" readonly></label><label class="field">Version<input name="trim" readonly></label><label class="field">Année<input name="year" readonly></label><label class="field">Motorisation<input name="fuel" readonly></label><label class="field">Transmission<input name="gearbox" readonly></label><label class="field">Puissance<input name="power" readonly></label>
    <label class="field">Kilométrage (km)<input type="number" min="0" max="999999" step="1" name="km" required></label><label class="field">Prix (€)<input type="number" min="1" max="999999" step="1" name="price" required></label></div><button class="button">Ajouter au parc de démonstration</button><p id="listing-status" aria-live="polite"></p></form></section></section>`;
  const plateForm = main.querySelector('#plate-form');
  const listing = main.querySelector('#listing-box');
  const form = main.querySelector('#listing-form');
  const example = stock[0];
  main.querySelector('#example').addEventListener('click',() => {
    plateForm.elements.plate.value = 'DE-094-MO';
    plateForm.requestSubmit();
  });
  plateForm.addEventListener('submit',event => {
    event.preventDefault();
    const normalized = plateForm.elements.plate.value.toUpperCase().replace(/[\s-]/g,'');
    const found = normalized === 'DE094MO';
    listing.hidden = !found;
    const status = main.querySelector('#plate-status');
    status.classList.toggle('error', !found);
    status.textContent = found ? 'Caractéristiques techniques préremplies à partir des données de démonstration.' : 'Cette version reconnaît uniquement la plaque fictive DE-094-MO.';
    if (!found) return;
    for (const [key,value] of Object.entries({model:example.name,trim:example.trim,year:example.year,fuel:example.fuel,gearbox:example.gearbox,power:example.power})) form.elements[key].value = value;
    form.elements.km.focus();
  });
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (listing.hidden) return;
    const values = new FormData(form);
    const records = readLocal();
    const id = 'AD94-D' + String(records.length+1).padStart(3,'0');
    const record = {...example,id,km:Number(values.get('km')),price:Number(values.get('price'))};
    try { localStorage.setItem(storageKey, JSON.stringify([...records,record])); }
    catch { main.querySelector('#listing-status').textContent = 'Impossible d’enregistrer dans ce navigateur.'; return; }
    location.href = '?vehicule=' + encodeURIComponent(id);
  });
}
if (params.get('espace') === 'vendeur') admin();
else if (current) detail(current);
else if (params.has('vehicule')) main.innerHTML = '<section class="wrap detail"><a class="back" href="./#stock">← Retour aux véhicules</a><h2>Fiche indisponible</h2><p>Retrouvez les annonces dans le parc.</p></section>';
else home();

document.querySelectorAll('[data-contact]').forEach(link => {
  const isPhone = link.dataset.contact === 'phone';
  const message = whatsappMessage(current);
  if (contactNumber) {
    link.href = isPhone ? 'tel:' + contactNumber : whatsappUrl(message, contactNumber);
    if (!isPhone) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    return;
  }
  link.href = isPhone ? '#appel-demo' : '#whatsapp-demo';
  link.addEventListener('click',event => {
    event.preventDefault();
    const body = document.querySelector('#dialog-body');
    body.innerHTML = isPhone
      ? '<h2>Appeler Autodeal 94</h2><p>Le numéro du concessionnaire sera ajouté à la version finale.</p>'
      : `<h2>Message WhatsApp</h2><p>Voici le message qui sera prérempli pour le concessionnaire. En démo, WhatsApp s’ouvre sans destinataire.</p><blockquote>${escape(message)}</blockquote><a class="button" href="${whatsappUrl(message)}" target="_blank" rel="noopener noreferrer">Ouvrir WhatsApp →</a>`;
    dialog.showModal();
  });
});
if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
