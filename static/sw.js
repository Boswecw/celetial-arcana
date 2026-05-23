import { precacheAndRoute } from 'workbox-precaching';

const CACHE_VERSION = 'v1.0.5';
const STATIC_CACHE = `celestia-arcana-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `celestia-arcana-runtime-${CACHE_VERSION}`;

// Runtime cache bounds. The previous implementation cached every successful
// GET indefinitely, which let memory and storage grow without bound and let
// stale assets persist long after a deploy. These limits let the browser
// evict the oldest / oldest-expired entries first.
const RUNTIME_CACHE_MAX_ENTRIES = 60;
const RUNTIME_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function trimRuntimeCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    const now = Date.now();

    // Evict expired entries (uses the Date response header we set below).
    for (const request of requests) {
      const cached = await cache.match(request);
      const dateHeader = cached?.headers.get('x-cached-at');
      if (dateHeader && now - Number(dateHeader) > RUNTIME_CACHE_MAX_AGE_MS) {
        await cache.delete(request);
      }
    }

    // Trim to max entries (FIFO — keys() returns insertion order).
    const remaining = await cache.keys();
    if (remaining.length > RUNTIME_CACHE_MAX_ENTRIES) {
      const overflow = remaining.length - RUNTIME_CACHE_MAX_ENTRIES;
      for (let i = 0; i < overflow; i++) {
        await cache.delete(remaining[i]);
      }
    }
  } catch (err) {
    console.error('Service Worker: trim failed', err);
  }
}

async function putRuntimeCached(request, response) {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    // Tag with insertion time so trimRuntimeCache can expire by age.
    const headers = new Headers(response.headers);
    headers.set('x-cached-at', String(Date.now()));
    const tagged = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await cache.put(request, tagged);
    await trimRuntimeCache();
  } catch (err) {
    console.error('Service Worker: runtime cache put failed', err);
  }
}

// Workbox precaches everything in the build manifest (see vite.config.ts
// globPatterns). We only manually cache the offline fallback page, which is a
// static file Workbox would still cover but we want guaranteed-present even
// if the manifest is empty during a partial build.
precacheAndRoute(self.__WB_MANIFEST || []);

const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
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

  // Never cache API responses through the service worker runtime cache.
  if (requestURL.pathname.startsWith('/api/')) {
    return;
  }

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
          return caches.match('/offline.html');
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
        if (cachedResponse) {
          return cachedResponse;
        }

        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            // Fire-and-forget the cache write so the user-visible response
            // path is not blocked by the trim sweep.
            putRuntimeCached(event.request, response.clone());

            return response;
          })
          .catch(async () => {
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }

            if (event.request.destination === 'image') {
              return caches.match('/Celestia_Arcana_banner.avif');
            }

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
