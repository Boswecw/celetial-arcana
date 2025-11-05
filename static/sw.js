const CACHE_VERSION = 'v1.0.3';
const STATIC_CACHE = `celestia-arcana-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `celestia-arcana-runtime-${CACHE_VERSION}`;

// Assets to cache for offline functionality
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/pwa.js',
  '/pwa-styles.css',
  '/Celestia_Arcana_banner.avif'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/');
        })
    );
    return;
  }

  if (PRECACHE_URLS.includes(requestURL.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, responseClone));
            return response;
          });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Clone the request for caching
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }

            if (event.request.destination === 'image') {
              return caches.match('/Celestia_Arcana_banner.avif');
            }

            // Return placeholder for other requests
            return new Response('Offline content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for form submissions when offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'birth-chart-sync') {
    event.waitUntil(syncBirthChartData());
  }
});

// Function to sync birth chart data when back online
async function syncBirthChartData() {
  try {
    // Retrieve stored birth chart requests
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();

    // Process any pending chart calculations
    for (const request of requests) {
      if (request.url.includes('calculate-chart') || request.url.includes('api/combined-reading')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.error('Failed to sync chart data:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handler (optional for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification('Celestia Arcana', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
