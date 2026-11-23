import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync('src/app.js','utf8').replace(/^import .*;\n/gm,'');
const sample=(id,status,price)=>({id,ref:'AD94-'+id,status,brand:'Peugeot',model:id,trim:'Allure',year:2021,km:50000,price,fuel:'Essence',gearbox:'Manuelle',photos:[{id:'demo-208',url:'/img/208.webp'}],extras:[]});
async function render(query=''){
const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://autodeal94.vercel.app/'+query,runScripts:'outside-only'});
dom.window.api=async()=>({phone:'+33612345678',vehicles:[sample('sold','vendu',1000),sample('soon','prochainement',3000),sample('available','disponible',20000)]});
dom.window.requestAnimationFrame=()=>{};dom.window.eval(source);await new Promise(r=>setTimeout(r,0));return dom.window;
}
const w=await render();const d=w.document;
assert.match(d.querySelector('h1').textContent,/13 ans/);
assert.match(d.title,/Voitures d’occasion à Valenton/);
assert.equal(d.querySelector('meta[name="robots"]').content,'index,follow');
assert.equal(d.querySelectorAll('h1').length,1);
assert.ok(!d.body.textContent.includes('13 ans à vos côtés'));
assert.equal(d.querySelectorAll('.mobile-contact [data-contact]').length,2);
assert.match(d.querySelector('.mobile-contact [data-contact="phone"]').href,/^tel:/);
assert.deepEqual([...d.querySelectorAll('.card:not(.service-card)')].map(c=>c.className),['card vehicle-disponible','card vehicle-prochainement','card vehicle-vendu']);
assert.match(d.querySelector('.status-vendu .tag').textContent,/Vendu/);
assert.equal(d.querySelectorAll('.service-card').length,1);
const form=d.querySelector('.filters');form.elements.sort.value='price';form.dispatchEvent(new w.Event('change'));assert.match(d.querySelector('.catalog-group:last-child .card').className,/vendu/);
form.elements.status.value='prochainement';form.dispatchEvent(new w.Event('change'));assert.equal(d.querySelectorAll('.card').length,1);assert.match(d.querySelector('.tag').textContent,/Prochainement/);
assert.equal(d.querySelectorAll('.directions a').length,2);
const service=(await render('?service=mandataire')).document;assert.match(service.title,/Mandataire/);assert.equal(service.querySelector('link[rel="canonical"]').getAttribute('href'),'https://autodeal94.vercel.app/?service=mandataire');assert.match(decodeURIComponent(service.querySelector('[data-contact="whatsapp"]').href),/mandataire automobile/);
const sold=(await render('?vehicule=sold')).document;assert.match(decodeURIComponent(sold.querySelector('[data-contact="whatsapp"]').href),/véhicule similaire/);
assert.ok(!d.querySelector('a[href="?espace=vendeur"]'));
console.log('PASS: trust copy, all status groups, sold-last sorting, filter, service page/WhatsApp, maps, hidden seller link');
