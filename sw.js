const CACHE = 'nutrichat-shell-v8';
const FILES = ['./','./index.html','./mobile.css','./mobile.js','./guidance.js','./dashboard.js','./dashboard.css','./recipes.js','./manifest.webmanifest','./assets/app-192.png','./assets/app-512.png','./assets/app-maskable.png','./assets/atlas-fruits.jpg','./assets/atlas-legumes.jpg','./assets/atlas-pantry.jpg','./assets/atlas-proteins.jpg','./assets/atlas-staples.jpg','./assets/atlas-vegetables.jpg','./assets/food-atlas-extra.jpg','./assets/food-atlas.jpg','./assets/menu-atlas.jpg','./assets/menu-meals.jpg','./assets/recipes/avena-fruta.jpg','./assets/recipes/yogur-berries.jpg','./assets/recipes/tostada-palta.jpg','./assets/recipes/cottage-fruta.jpg','./assets/recipes/avena-manzana.jpg','./assets/recipes/pan-quesillo.jpg','./assets/recipes/pollo-quinoa.jpg','./assets/recipes/lentejas-zapallo.jpg','./assets/recipes/garbanzo-fresco.jpg','./assets/recipes/atun-fideos.jpg','./assets/recipes/porotos-choclo.jpg','./assets/recipes/tofu-arroz.jpg','./assets/recipes/pavo-camote.jpg','./assets/recipes/merluza-papa.jpg','./assets/recipes/wrap-pollo.jpg','./assets/recipes/ensalada-huevo.jpg','./assets/recipes/quinoa-garbanzos.jpg','./assets/recipes/pita-atun.jpg','./assets/recipes/soya-verduras.jpg','./assets/recipes/quesillo-palitos.jpg','./assets/recipes/yogur-platano.jpg','./assets/recipes/manzana-mani.jpg','./assets/recipes/cottage-berries.jpg','./assets/recipes/hummus-pan.jpg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
// Wait for the old app to close before activating an update, keeping each session consistent.
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nutrichat-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const key=event.request.mode==='navigate'?new URL('./index.html',self.registration.scope).href:event.request;
  const saved=await cache.match(key);
  if(saved)return saved;
  return fetch(event.request);
 }));
});
