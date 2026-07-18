/* Gelecek Envanteri — service worker (network-first) */
const V = 'ge-v110';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))  /* CDN kopyasını değil tazesini çek */
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V && k !== V + '-fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fetchT(req, ms){
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return fetch(req, { signal: ac.signal }).finally(() => clearTimeout(t));
}

async function netFirst(req){
  const c = await caches.open(V);
  try {
    const res = await fetchT(req, 4000);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate'){
      const shell = await c.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) return;
  if (url.hostname.includes('fonts.g')) {                       /* fontlar: cache-first */
    e.respondWith(caches.open(V + '-fonts').then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  if (url.origin === location.origin) e.respondWith(netFirst(e.request));  /* uygulama: önce ağ, çevrimdışıysa cache */
});
