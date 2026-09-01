const CACHE_NAME = 'dagoos-driver-v10';
const STATIC_CACHE = 'dagoos-static-v10';

const STATIC_ASSETS = [
  '/',
  '/dashboard.html',
  '/config.js',
  '/js/router.js',
  '/js/autosave.js',
  '/js/login.js',
  '/pages/home.js',
  '/pages/courses.js',
  '/pages/stats.js',
  '/pages/expenses.js',
  '/pages/finances.js',
  '/pages/versements.js',
  '/pages/profil.js',
  '/pages/notifications.js',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les API
  if (event.request.url.includes('/api/')) return;

  // Navigation : servir le cache en priorité, sinon le réseau
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/dashboard.html');
      })
    );
    return;
  }

  // Fichiers statiques : cache-first avec fallback silencieux
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // En cas d'échec réseau, renvoyer une réponse vide
        // pour éviter les erreurs non gérées
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
