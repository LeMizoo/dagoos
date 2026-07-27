// ========================================
// DAGOO'S DRIVER - SERVICE WORKER PWA
// ========================================

const CACHE_NAME = 'dagoos-driver-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
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

// Installation : mise en cache des assets essentiels
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker - Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache des assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('✅ Installation terminée');
                return self.skipWaiting();
            })
    );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker - Activation...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('🗑️ Suppression ancien cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('✅ Activation terminée');
            return self.clients.claim();
        })
    );
});

// Fetch : stratégie Cache First avec fallback réseau
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes API
    if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Retourne le cache si trouvé
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Sinon, fetch réseau
                return fetch(event.request)
                    .then((response) => {
                        // Mettre en cache les bonnes réponses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Fallback : page d'accueil pour les requêtes de navigation
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                        return new Response('Mode hors ligne - Données non disponibles');
                    });
            })
    );
});

// Notification quand une mise à jour est disponible
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
