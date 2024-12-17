const CACHE_NAME = 'fuel-pwa-v1';
const CACHE_FILES = [
  '/fuel-pwa/',
  '/fuel-pwa/index.html',
//  '/fuel-pwa/css/styles.css',
//  '/fuel-pwa/js/script.js',
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
        console.log('Cache otvorená');
        return cache.addAll(CACHE_FILES);
      })
  );
});

// Aktivácia Service Workera
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Zachytávanie požiadaviek
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - vrátime response z cache
        if (response) {
          return response;
        }

        // Inak skúsime fetchnúť požiadavku zo siete
        return fetch(event.request)
          .then((response) => {
            // Kontrola či máme validnú response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Klonujeme response, pretože cache a browser ju potrebujú
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});