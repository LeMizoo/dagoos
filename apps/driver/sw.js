const CACHE_NAME = 'dagoos-driver-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/dashboard.html',
        '/js/login.js',
        '/js/config.js',
        '/config.js',
        '/manifest.json',
        '/favicon.svg',
        '/offline.html',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprimer les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne pas mettre en cache les appels API
  if (event.request.url.includes('/api/')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
