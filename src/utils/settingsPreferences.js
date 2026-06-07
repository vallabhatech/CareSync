/**
 * settingsPreferences.js
 *
 * Small persistence helpers for user-facing preference toggles on the
 * Settings page that are not part of the profile object itself.
 *
 * The email-notification preference is stored under its own localStorage
 * key (mirroring how the push-notification preference is persisted under
 * PUSH_ENABLED_KEY in utils/notifications.js), so it survives reloads
 * independently of the authenticated user object.
 */

/** localStorage key for the email-notification preference. */
export const EMAIL_NOTIFICATIONS_KEY = 'caresync_email_notifications';

/**
 * Read the persisted email-notification preference.
 *
 * Defaults to `true` when nothing has been stored yet, matching the
 * previous in-component default (notifications enabled by default).
 *
 * @returns {boolean} Whether email notifications are enabled.
 */
export function getEmailNotificationsEnabled() {
  const stored = localStorage.getItem(EMAIL_NOTIFICATIONS_KEY);
  // Default-on contract: only an explicit 'false' disables. Anything else —
  // absent (null), 'true', or a legacy/unexpected value — resolves to enabled,
  // so corrupt or older stored values never silently turn notifications off.
  return stored !== 'false';
}

/**
 * Persist the email-notification preference.
 *
 * @param {boolean} enabled - Whether email notifications are enabled.
 * @returns {boolean} The value that was stored (for convenient chaining).
 */
export function setEmailNotificationsEnabled(enabled) {
  const value = Boolean(enabled);
  localStorage.setItem(EMAIL_NOTIFICATIONS_KEY, value ? 'true' : 'false');
  return value;
}
