const CACHE_NAME = 'fuel-pwa-v8';
const DYNAMIC_CACHE = 'fuel-pwa-dynamic-v8';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dní v milisekundách

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

// Pomocná funkcia na kontrolu platnosti cache
async function isCacheValid(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length === 0) return false;

    const cacheTimestamp = await cache.match('cache-timestamp');
    if (!cacheTimestamp) return false;

    const timestamp = await cacheTimestamp.text();
    return Date.now() - parseInt(timestamp) < CACHE_DURATION;
}

// Inštalácia Service Workera
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(async (cache) => {
                console.log('🔧 Vytváram novú cache:', CACHE_NAME);
                console.log('📋 Cachujem súbory:', CACHE_FILES);
                // Pridanie časovej známky do cache
                await cache.put('cache-timestamp', new Response(Date.now().toString()));
                return cache.addAll(CACHE_FILES);
            }),
            self.skipWaiting()
        ])
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
                            console.log('Mažem starú cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Zachytávanie požiadaviek - Pravý Cache First (offline-first)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            // Debug: Log všetky fetch requesty
            console.log('🔍 Fetch request:', event.request.url);
            
            // VŽDY najprv skús cache - bez akýchkoľvek validácií
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                console.log('✅ Serving from cache:', event.request.url);
                
                // Neblokujúci background refresh (len ak je online)
                if (navigator.onLine) {
                    event.waitUntil(
                        fetch(event.request)
                            .then((networkResponse) => {
                                if (networkResponse && networkResponse.status === 200) {
                                    return caches.open(CACHE_NAME)
                                        .then((cache) => {
                                            cache.put(event.request, networkResponse.clone());
                                            cache.put('cache-timestamp', new Response(Date.now().toString()));
                                            console.log('Cache refreshed for:', event.request.url);
                                        });
                                }
                            })
                            .catch(() => {
                                console.log('Background refresh failed for:', event.request.url);
                            })
                    );
                }
                
                return cachedResponse;
            }

            // Ak nie je v cache, pokús sa o network request
            try {
                const networkResponse = await fetch(event.request);
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Cachuj úspešný network response
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());
                await cache.put('cache-timestamp', new Response(Date.now().toString()));
                console.log('Network response cached for:', event.request.url);
                return networkResponse;
            } catch (error) {
                console.log('❌ Network fetch failed:', error, 'for:', event.request.url);
                
                // Final fallback - skús znovu cache (možno sa tam niečo objavilo)
                const fallbackCache = await caches.match(event.request);
                if (fallbackCache) {
                    console.log('✅ Using fallback cache for:', event.request.url);
                    return fallbackCache;
                }
                
                console.log('❌ No cache found for:', event.request.url);
                return new Response(
                    'Aplikácia je offline a súbor nie je v cache.',
                    { status: 503, statusText: 'Service Unavailable' }
                );
            }
        })()
    );
});

// Spracovanie správ
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        event.waitUntil(
            // Len aktualizuj timestamp ak je online, neskúšaj fetchovať súbory
            navigator.onLine ? 
                Promise.all([
                    caches.open(CACHE_NAME).then(cache => 
                        cache.put('cache-timestamp', new Response(Date.now().toString()))
                    ),
                    ...CACHE_FILES.map(url => 
                        fetch(url)
                            .then(response => {
                                if (response.ok) {
                                    return caches.open(CACHE_NAME)
                                        .then(cache => cache.put(url, response));
                                }
                                throw new Error('Response not ok');
                            })
                            .catch(error => {
                                console.error('Cache update failed for:', url, error);
                            })
                    )
                ]) :
                // Offline - nerobíme nič, cache zostáva nedotknutá
                Promise.resolve().then(() => {
                    console.log('Offline - cache update preskočený');
                })
        );
    }
});