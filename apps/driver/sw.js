// ========================================
// DAGOO'S DRIVER - SERVICE WORKER PWA
// ========================================

const CACHE_NAME = 'dagoos-driver-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/splash.html',
    '/offline.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/favicon.png',
    '/favicon.ico',
    '/pages/home.js',
    '/pages/courses.js',
    '/pages/stats.js',
    '/pages/versements.js',
    '/pages/profil.js'
];

// Installation
self.addEventListener('install', (event) => {
    console.log('🚀 SW - Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activation
self.addEventListener('activate', (event) => {
    console.log('🔄 SW - Activation...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - stratégie Network First avec fallback cache
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes API et Chrome extensions
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('chrome-extension') ||
        event.request.url.includes('socket.io')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Mettre en cache les réponses valides
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback au cache
                return caches.match(event.request)
                    .then((cached) => cached || caches.match('/offline.html'));
            })
    );
});
