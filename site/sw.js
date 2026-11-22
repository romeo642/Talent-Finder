// Talent Finder service worker: network first, so new deployments show immediately.
const CACHE = 'tf-shell-v1';
const SHELL = ['./', 'index.html', 'app.css', 'js/main.js', 'js/shell.js', 'logo.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  const u = new URL(r.url);
  // Supabase and other sites always go straight to the network
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match('index.html')))
  );
});
