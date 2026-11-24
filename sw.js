const CACHE = 'nutrichat-shell-v1';
const FILES = ['./','./index.html','./mobile.css','./mobile.js','./recipes.js','./manifest.webmanifest','./assets/app-192.png','./assets/app-512.png','./assets/app-maskable.png','./assets/atlas-fruits.jpg','./assets/atlas-legumes.jpg','./assets/atlas-pantry.jpg','./assets/atlas-proteins.jpg','./assets/atlas-staples.jpg','./assets/atlas-vegetables.jpg','./assets/food-atlas-extra.jpg','./assets/food-atlas.jpg','./assets/menu-atlas.jpg','./assets/menu-meals.jpg'];
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
