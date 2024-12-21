const CACHE_NAME = 'fuel-pwa-v1';
const DYNAMIC_CACHE = 'fuel-pwa-dynamic-v1';
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

// Inštalácia Service Workera
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache vytvorená');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => self.skipWaiting()) // Zabezpečí okamžitú aktiváciu
    );
});

// Aktivácia Service Workera
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Vyčistenie starých cache
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('Vymazávanie starej cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Prevzatie kontroly nad všetkými tabmi
            self.clients.claim()
        ])
    );
});

// Zachytávanie požiadaviek
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Najprv vrátime odpoveď z cache ak existuje
                if (cachedResponse) {
                    // Na pozadí skúsime aktualizovať cache ak sme online
                    if (navigator.onLine) {
                        fetch(event.request)
                            .then((networkResponse) => {
                                if (networkResponse && networkResponse.status === 200) {
                                    caches.open(CACHE_NAME)
                                        .then((cache) => {
                                            cache.put(event.request, networkResponse.clone());
                                        });
                                }
                            })
                            .catch(() => console.log('Cache update failed'));
                    }
                    return cachedResponse;
                }

                // Ak nie je v cache, ideme na sieť
                return fetch(event.request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Uložíme do cache
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('Fetch failed:', error);
                        // Tu môžete pridať fallback pre offline obsah
                        return new Response('Offline content');
                    });
            })
    );
});

// Prijímanie správ
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return Promise.all(
                        CACHE_FILES.map(url => 
                            fetch(url)
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                })
                                .catch(error => console.log('Failed to update:', url, error))
                        )
                    );
                })
        );
    }
});