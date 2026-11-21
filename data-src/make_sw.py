#!/usr/bin/env python3
"""Writes www/sw.js (offline app shell for the web / PWA build) with a fresh cache version."""
import os, glob, json, time
W = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'); os.chdir(W)
files = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'] + sorted(glob.glob('css/*.css')) + sorted(glob.glob('js/*.js'))
files += [f for f in sorted(glob.glob('fonts/*.woff2')) if 'cairo' in f or 'oswald' in f]
open('sw.js', 'w').write(f"""/* LEGENDS XI service worker — offline app shell. Created by Dr HOSSAM Mo */
const V = 'lxi-shell-{int(time.time())}';
const SHELL = {json.dumps(files)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lxi-shell-') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;     // photos (Wikimedia) are cached by the app itself
  e.respondWith(caches.open(V).then(async c => {{
    const hit = await c.match(e.request, {{ ignoreSearch: true }});
    const net = fetch(e.request).then(r => {{ if (r.ok) c.put(e.request, r.clone()); return r; }}).catch(() => hit);
    return hit || net;
  }}));
}});
""")
print('sw.js:', len(files), 'files')
