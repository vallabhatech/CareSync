/**
 * Notification helpers for CareSync medicine reminders.
 *
 * Provides two main exports:
 * - `requestNotificationPermission` — prompts the user for permission.
 * - `scheduleNotifications` — sets up `setTimeout` timers for today's
 *   medicines and fires a service-worker notification when due.
 *
 * All timers are tracked internally so they can be cleared when the
 * schedule is rebuilt (e.g. after adding/removing a medicine).
 *
 * @module utils/notifications
 */

/** Internal store of active timer IDs so we can clear them on reschedule. */
let activeTimers = [];

/** localStorage key used by Settings to persist the user's opt-in choice. */
export const PUSH_ENABLED_KEY = 'caresync_push_enabled';

/**
 * Return today's date as a local YYYY-MM-DD string.
 *
 * `<input type="date">` values use the user's local calendar day, so we must
 * compare against the same local day — **not** `toISOString()` which is UTC
 * and can differ around midnight in non-UTC timezones.
 *
 * @param {Date} [d=new Date()] - The date to format.
 * @returns {string} e.g. `"2026-06-06"`
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ------------------------------------------------------------------ */
/*  Permission                                                         */
/* ------------------------------------------------------------------ */

/**
 * Request browser notification permission.
 *
 * Resolves to `'granted'`, `'denied'`, or `'default'`.
 * Returns `'denied'` immediately if the Notification API is unsupported.
 *
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in globalThis)) {
    console.warn('This browser does not support notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const result = await Notification.requestPermission();
  return result;
}

/* ------------------------------------------------------------------ */
/*  Scheduling                                                         */
/* ------------------------------------------------------------------ */

/**
 * Clear every active reminder timer.
 *
 * Called at the start of `scheduleNotifications` to ensure we never
 * have duplicate timers running for the same medicine.
 */
export function clearScheduledNotifications() {
  activeTimers.forEach((id) => clearTimeout(id));
  activeTimers = [];
}

/**
 * Schedule browser notifications for today's medicines.
 *
 * For each medicine whose `date` matches today and whose `time` (HH:MM)
 * is still in the future, a `setTimeout` is registered. When it fires
 * the service worker's `showNotification` method is used so the
 * notification can appear even if the tab is in the background.
 *
 * Prerequisites checked before scheduling:
 * 1. Push notifications are enabled in settings (`caresync_push_enabled`).
 * 2. Browser supports the Notification API.
 * 3. Notification permission is `'granted'`.
 * 4. A service worker is registered and ready.
 *
 * @param {Array<{id: string, name: string, time: string, date: string}>} medicines
 *   The full list of saved medicines. Only today's entries with a future
 *   `time` will be scheduled.
 * @returns {void}
 */
export function scheduleNotifications(medicines) {
  clearScheduledNotifications();

  // Gate: user must have opted in via Settings.
  const pushEnabled = localStorage.getItem(PUSH_ENABLED_KEY);
  if (pushEnabled !== 'true') return;

  // Gate: browser support + granted permission.
  if (!('Notification' in globalThis)) return;
  if (Notification.permission !== 'granted') return;

  const today = getLocalDateString();
  const now = Date.now();

  medicines
    .filter((med) => med.date === today)
    .forEach((med) => {
      const [hours, minutes] = med.time.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      const delay = target.getTime() - now;
      if (delay <= 0) return; // already past — skip

      const timerId = setTimeout(() => {
        fireNotification(med);
      }, delay);

      activeTimers.push(timerId);
    });
}

/* ------------------------------------------------------------------ */
/*  Notification delivery                                              */
/* ------------------------------------------------------------------ */

/**
 * Fire a notification via the service worker (if available) or fall
 * back to the basic `new Notification()` constructor.
 *
 * @param {{name: string, time: string}} med  The medicine entry.
 * @returns {void}
 */
async function fireNotification(med) {
  const title = '💊 Medicine Reminder';
  const options = {
    body: `Time to take ${med.name}`,
    icon: '/favicon.ico',
    tag: `caresync-med-${med.id || med.name}`,
    requireInteraction: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }
  } catch (err) {
    // Service worker unavailable — fall through to basic API.
    console.warn('Service worker notification failed, falling back:', err);
  }

  // Fallback: plain Notification constructor (only works while tab is focused).
  // eslint-disable-next-line no-new
  new Notification(title, options);
}

/* ------------------------------------------------------------------ */
/*  Testing helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Expose `activeTimers` length for test assertions.
 *
 * @returns {number}
 */
export function getActiveTimerCount() {
  return activeTimers.length;
}
