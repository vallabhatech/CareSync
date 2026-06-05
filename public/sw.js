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
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = '/medicine-tracker';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing tab that already has the app open.
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // No matching tab — open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});

/**
 * activate — claim all open clients immediately so the SW can handle
 * notifications without requiring a page reload after first install.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
