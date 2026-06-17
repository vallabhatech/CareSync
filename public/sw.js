/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'caresync-cache-v1';

/**
 * CareSync Service Worker — medicine reminder notifications & offline caching.
 *
 * Handles incoming `showNotification` calls from the main thread and
 * reacts to notification clicks by navigating to the Medicine Tracker.
 * Also caches static assets and API responses for offline use.
 *
 * Registered in `src/index.js` via `navigator.serviceWorker.register`.
 *
 * @file public/sw.js
 */

/**
 * notificationclick — fired when the user taps/clicks a notification.
 */
globalThis.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/medicine-tracker';

  event.waitUntil(
    globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing tab that already has the app open.
      for (const client of clientList) {
        const rawPath = new URL(client.url).pathname;
        const clientPath = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
        if (clientPath === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // No matching tab — open a new one.
      if (globalThis.clients.openWindow) {
        return globalThis.clients.openWindow(targetUrl);
      }
    })
  );
});

globalThis.addEventListener('install', (event) => {
  globalThis.skipWaiting();
});

/**
 * activate — claim all open clients immediately and clean up old caches.
 */
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => globalThis.clients.claim())
  );
});

/**
 * fetch — intercept network requests for offline caching.
 */
globalThis.addEventListener('fetch', (event) => {
  const { request } = event;

  // Handle API GET requests (Network First strategy)
  if (request.url.includes('/api/') && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ error: 'Offline', message: 'No cached data available' }), 
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Skip other non-GET requests (handled by axios interceptor in api.js)
  if (request.method !== 'GET') return;

  // Static Assets (Network First with Cache Fallback)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 || response.type === 'opaque') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // For navigation requests, fallback to index.html if offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html').then(idxResp => {
              if (idxResp) return idxResp;
              return new Response('Offline. App could not be loaded.', { status: 503, headers: { 'Content-Type': 'text/html' } });
            });
          }

          // Generic fallback to avoid TypeError: Failed to convert value to 'Response'
          return new Response('', { status: 503, statusText: 'Service Unavailable (Offline)' });
        });
      })
  );
});
