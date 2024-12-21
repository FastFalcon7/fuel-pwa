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
        console.log('Statická cache vytvorená');
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
        // Najprv skúsime získať z cache
        if (cachedResponse) {
          // Ak sme online, aktualizujeme cache na pozadí
          if (navigator.onLine) {
            fetch(event.request)
              .then((response) => {
                if (response.ok) {
                  updateCache(event.request, response.clone());
                }
              })
              .catch(() => console.log('Nepodarilo sa aktualizovať cache'));
          }
          return cachedResponse;
        }

        // Ak nie je v cache, skúsime zo siete
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Uložíme do dynamickej cache
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Fetch zlyhal:', error);
            // Tu môžete pridať fallback pre offline obsah
          });
      })
  );
});

// Periodické overenie spojenia a aktualizácia cache
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateAllCache());
  }
});

// Funkcia na aktualizáciu cache
async function updateCache(request, response) {
  const cache = await caches.open(CACHE_NAME);
  return cache.put(request, response);
}

// Funkcia na aktualizáciu všetkej cache
async function updateAllCache() {
  const cache = await caches.open(CACHE_NAME);
  for (const url of CACHE_FILES) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.log('Nepodarilo sa aktualizovať:', url);
    }
  }
}