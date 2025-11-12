const CACHE_NAME = 'fuel-pwa-v13';
const DYNAMIC_CACHE = 'fuel-pwa-dynamic-v13';
const IDB_NAME = 'fuel-pwa-idb';
const IDB_VERSION = 1;
const IDB_STORE = 'files';

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

// Kritické súbory pre IndexedDB backup (odolnejšie voči iOS cache eviction)
const CRITICAL_FILES = [
    '/fuel-pwa/index.html',
    '/fuel-pwa/manifest.json'
];

// IndexedDB Helper Functions
function openIDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                db.createObjectStore(IDB_STORE);
            }
        };
    });
}

async function saveToIDB(url, response) {
    try {
        const db = await openIDB();
        const transaction = db.transaction([IDB_STORE], 'readwrite');
        const store = transaction.objectStore(IDB_STORE);

        const blob = await response.blob();
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        store.put({
            blob: blob,
            headers: headers,
            status: response.status,
            statusText: response.statusText
        }, url);

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('IndexedDB save error:', error);
    }
}

async function getFromIDB(url) {
    try {
        const db = await openIDB();
        const transaction = db.transaction([IDB_STORE], 'readonly');
        const store = transaction.objectStore(IDB_STORE);

        return new Promise((resolve, reject) => {
            const request = store.get(url);
            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    const response = new Response(data.blob, {
                        status: data.status,
                        statusText: data.statusText,
                        headers: data.headers
                    });
                    resolve(response);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('IndexedDB get error:', error);
        return null;
    }
}

// Inštalácia Service Workera s IndexedDB backup
self.addEventListener('install', (event) => {
    console.log('🔧 Installing Service Worker:', CACHE_NAME);

    event.waitUntil(
        Promise.all([
            // 1. Cachuj všetky súbory do Cache API
            caches.open(CACHE_NAME).then((cache) => {
                console.log('📋 Caching files to Cache API');
                return cache.addAll(CACHE_FILES);
            }),

            // 2. Backup kritických súborov do IndexedDB (odolnejšie)
            (async () => {
                console.log('💾 Backing up critical files to IndexedDB');
                for (const url of CRITICAL_FILES) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await saveToIDB(url, response.clone());
                            console.log('✅ Backed up to IDB:', url);
                        }
                    } catch (error) {
                        console.error('❌ IDB backup failed for:', url, error);
                    }
                }
            })(),

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

// Zachytávanie požiadaviek - Multi-layer fallback (Cache → IndexedDB → Network)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        (async () => {
            const url = new URL(event.request.url);

            // 1. Najprv skús Cache API (najrýchlejšie)
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                // Background refresh ak je online
                if (navigator.onLine) {
                    event.waitUntil(
                        (async () => {
                            try {
                                const networkResponse = await fetch(event.request);
                                if (networkResponse && networkResponse.status === 200) {
                                    const cache = await caches.open(CACHE_NAME);
                                    await cache.put(event.request, networkResponse.clone());

                                    // Backup kritických súborov do IDB
                                    if (CRITICAL_FILES.includes(url.pathname)) {
                                        await saveToIDB(url.pathname, networkResponse.clone());
                                    }
                                }
                            } catch (error) {
                                // Background refresh failed - no problem
                            }
                        })()
                    );
                }
                return cachedResponse;
            }

            // 2. Cache miss - skús IndexedDB (odolnejšie)
            if (CRITICAL_FILES.includes(url.pathname)) {
                const idbResponse = await getFromIDB(url.pathname);
                if (idbResponse) {
                    console.log('✅ Serving from IndexedDB:', url.pathname);

                    // Refresh cache z IDB (restore cache)
                    event.waitUntil(
                        caches.open(CACHE_NAME).then(cache =>
                            cache.put(event.request, idbResponse.clone())
                        )
                    );

                    return idbResponse;
                }
            }

            // 3. Skús network
            try {
                const networkResponse = await fetch(event.request);
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Cachuj úspešný network response
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());

                // Backup kritických súborov do IDB
                if (CRITICAL_FILES.includes(url.pathname)) {
                    await saveToIDB(url.pathname, networkResponse.clone());
                }

                return networkResponse;
            } catch (error) {
                // 4. Final fallback - skús cache znovu
                const fallbackCache = await caches.match(event.request);
                if (fallbackCache) {
                    return fallbackCache;
                }

                return new Response(
                    'Aplikácia je offline a súbor nie je dostupný.',
                    { status: 503, statusText: 'Service Unavailable' }
                );
            }
        })()
    );
});

// Spracovanie správ - s IndexedDB refresh
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'UPDATE_CACHE') {
        if (!navigator.onLine) {
            console.log('Offline - cache update preskočený');
            return;
        }

        event.waitUntil(
            (async () => {
                console.log('🔄 Updating cache and IndexedDB backups');
                const cache = await caches.open(CACHE_NAME);

                for (const url of CACHE_FILES) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response.clone());

                            // Backup kritických súborov do IDB
                            if (CRITICAL_FILES.includes(url)) {
                                await saveToIDB(url, response.clone());
                                console.log('✅ Updated IDB backup:', url);
                            }
                        }
                    } catch (error) {
                        console.error('❌ Cache update failed for:', url, error);
                    }
                }
            })()
        );
    }

    // Nová správa pre verifikáciu cache
    if (event.data && event.data.type === 'VERIFY_CACHE') {
        event.waitUntil(
            (async () => {
                const cache = await caches.open(CACHE_NAME);
                const keys = await cache.keys();
                console.log('📦 Cache contains', keys.length, 'items');

                // Verifikuj IDB
                try {
                    const db = await openIDB();
                    const transaction = db.transaction([IDB_STORE], 'readonly');
                    const store = transaction.objectStore(IDB_STORE);
                    const countRequest = store.count();

                    countRequest.onsuccess = () => {
                        console.log('💾 IndexedDB contains', countRequest.result, 'backups');
                    };
                } catch (error) {
                    console.error('❌ IDB verification failed:', error);
                }
            })()
        );
    }
});
