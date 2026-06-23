const CACHE_APP = 'sumendi-app-v5';
const CACHE_DATA = 'sumendi-data-v5';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];
const API_URL = 'script.google.com';

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_APP)
      .then(function(c){return c.addAll(ASSETS);})
      .then(function(){return self.skipWaiting();})
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE_APP && k!==CACHE_DATA;})
            .map(function(k){return caches.delete(k);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  var url = e.request.url;

  // Datos de Drive (Google Apps Script) — cache-then-network
  if(url.indexOf(API_URL) >= 0){
    e.respondWith(
      caches.open(CACHE_DATA).then(function(cache){
        return fetch(e.request).then(function(response){
          // Guardar copia fresca en caché
          cache.put(e.request, response.clone());
          return response;
        }).catch(function(){
          // Sin red — devolver caché aunque sea antigua
          return cache.match(e.request);
        });
      })
    );
    return;
  }

  // Librerías externas (jsPDF, SheetJS) — cache-first
  if(url.indexOf('cdnjs.cloudflare.com') >= 0){
    e.respondWith(
      caches.open(CACHE_DATA).then(function(cache){
        return cache.match(e.request).then(function(cached){
          if(cached) return cached;
          return fetch(e.request).then(function(response){
            cache.put(e.request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // App shell — cache-first
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    })
  );
});
