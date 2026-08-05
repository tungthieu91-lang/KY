const CACHE='ky-ai-v17-2-1-carousel-20260805-6';
const CORE=['./','./index.html','./app.css','./app.js','./v16-features.js','./v16-features.css','./locations.js','./splash-gate.js','./manifest.webmanifest','./data/initial.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(u.pathname.endsWith('/data/index.json')){e.respondWith(caches.open(CACHE).then(async c=>{const old=await c.match(e.request);const fresh=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>old);return old||fresh}));return}
 e.respondWith(caches.match(e.request).then(old=>old||fetch(e.request).then(r=>{if(r.ok&&['script','style','document','image'].includes(e.request.destination))caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r})))
});