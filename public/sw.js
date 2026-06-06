/* eslint-disable no-restricted-globals */

/**
 * CareSync Service Worker — medicine reminder notifications.
 *
 * Handles incoming `showNotification` calls from the main thread and
 * reacts to notification clicks by navigating to the Medicine Tracker.
 *
 * Registered in `src/index.js` via `navigator.serviceWorker.register`.
 *
 * @file public/sw.js
 */

/**
 * notificationclick — fired when the user taps/clicks a notification.
 *
 * Attempts to focus an existing CareSync window on `/medicine-tracker`.
 * If no matching client is found, opens a new window instead.
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

/**
 * activate — claim all open clients immediately so the SW can handle
 * notifications without requiring a page reload after first install.
 */
globalThis.addEventListener('activate', (event) => {
  event.waitUntil(globalThis.clients.claim());
});
