const CACHE_NAME = 'dagoos-driver-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/manifest.json',
    '/js/router.js',
    '/pages/home.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});
