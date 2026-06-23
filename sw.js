const CACHE_APP = 'sumendi-app-v5';
const CACHE_DATA = 'sumendi-data-v5';
const BASE = '/sumendi-app';
const ASSETS = [
  BASE+'/',
  BASE+'/index.html',
  BASE+'/manifest.json',
  BASE+'/icon-192.png',
  BASE+'/icon-512.png'
];

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

  // Datos GitHub Pages y CDN — cache con red primero
  if(url.indexOf('github.io') >= 0 || url.indexOf('cdnjs.cloudflare.com') >= 0){
    e.respondWith(
      caches.open(CACHE_DATA).then(function(cache){
        return fetch(e.request).then(function(response){
          cache.put(e.request, response.clone());
          return response;
        }).catch(function(){
          return cache.match(e.request);
        });
      })
    );
    return;
  }

  // App shell — cache primero
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request);
    })
  );
});
