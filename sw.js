/* Gelecek Envanteri — service worker */
const V = 'ge-v1.2.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) return; // never cache auth/drive
  // fonts: cache-first runtime
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(caches.open(V + '-fonts').then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const res = await fetch(e.request); c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  // app shell: cache-first, network fallback + refresh
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(hit =>
      hit || fetch(e.request).then(res => { caches.open(V).then(c => c.put(e.request, res.clone())); return res; })
    ).catch(() => caches.match('./index.html')));
  }
});
