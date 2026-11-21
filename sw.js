/* LEGENDS XI service worker — offline app shell. Created by Dr HOSSAM Mo */
const V = 'lxi-shell-1795231104';
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icons/icon-192.png", "icons/icon-512.png", "css/app.css", "css/fonts-extra.css", "css/v4.css", "js/app.js", "js/core.js", "js/data.js", "js/i18n.js", "js/ui.js", "js/views-connect.js", "js/views-cups.js", "js/views-games.js", "js/views-guess.js", "js/views-home.js", "js/views-legends.js", "js/views-squads.js", "fonts/cairo-arabic-400-normal.woff2", "fonts/cairo-arabic-600-normal.woff2", "fonts/cairo-arabic-700-normal.woff2", "fonts/cairo-arabic-900-normal.woff2", "fonts/cairo-latin-400-normal.woff2", "fonts/cairo-latin-600-normal.woff2", "fonts/cairo-latin-700-normal.woff2", "fonts/cairo-latin-900-normal.woff2", "fonts/oswald-latin-500-normal.woff2", "fonts/oswald-latin-700-normal.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lxi-shell-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;     // photos (Wikimedia) are cached by the app itself
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
