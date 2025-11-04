const CACHE_NAME = 'celestia-arcana-v1.0.0';
const STATIC_CACHE = 'celestia-arcana-static-v1.0.0';

// Assets to cache for offline functionality
const CACHE_ASSETS = [
  '/',
  '/deck',
  '/alignment',
  '/reading',
  '/manifest.json',
  '/pwa.js',
  '/pwa-styles.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Service Worker: Clearing old cache', cacheName);
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
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Clone the request for caching
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving offline page', error);

            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
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
    const cache = await caches.open(CACHE_NAME);
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
