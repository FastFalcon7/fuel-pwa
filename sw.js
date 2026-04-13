const CACHE_NAME = 'fuel-pwa-v19';

const CACHE_FILES = [
    '/fuel-pwa/',
    '/fuel-pwa/index.html',
    '/fuel-pwa/manifest.json',
    '/fuel-pwa/assets/icon-48x48.png',
    '/fuel-pwa/assets/icon-72x72.png',
    '/fuel-pwa/assets/icon-96x96.png',
    '/fuel-pwa/assets/icon-128x128.png',
    '/fuel-pwa/assets/icon-144x144.png',
    '/fuel-pwa/assets/icon-152x152.png',
    '/fuel-pwa/assets/icon-167x167.png',
    '/fuel-pwa/assets/icon-180x180.png',
    '/fuel-pwa/assets/icon-192x192.png',
    '/fuel-pwa/assets/icon-256x256.png',
    '/fuel-pwa/assets/icon-384x384.png',
    '/fuel-pwa/assets/icon-512x512.png'
];

// Inštalácia Service Workera - SIMPLE
self.addEventListener('install', (event) => {
    console.log('SW: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: Caching files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

// Aktivácia Service Workera - SIMPLE
self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Zachytávanie požiadaviek - SIMPLE Cache First (offline-first)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        return caches.match(event.request);
                    });
            })
    );
});

// Spracovanie správ - REMOVED (not needed for simple cache-first)
// Message handling odstránené kvôli jednoduchosti
