const CACHE = 'sumendi-v8';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192v2.png',
  '/icon-512v2.png',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

// Instalar: cachear todos los assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // activar inmediatamente
});

// Activar: borrar caches antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', e => {
  // Solo interceptar peticiones GET al mismo origen
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar en cache si es un asset conocido
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
