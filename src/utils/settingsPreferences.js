/**
 * settingsPreferences.js
 *
 * Persistence helpers for user-facing preference toggles on the
 * Settings page (notifications, dashboard customization, audio alerts).
 */

/** localStorage key for the email-notification preference. */
export const EMAIL_NOTIFICATIONS_KEY = 'caresync_email_notifications';

/** localStorage key for the dashboard customization preference. */
export const DASHBOARD_SETTINGS_KEY = 'caresync_dashboard_settings';

/** localStorage key for audio/sound notifications preference. */
export const SOUND_NOTIFICATIONS_KEY = 'caresync_sound_enabled';

export const DEFAULT_DASHBOARD_SETTINGS = {
  showGreeting: true,
  showHealthQuote: true,
  showStatsRow: true,
  visibleCards: {
    todaysMedicines: true,
    recentSymptomChecks: true,
    dosageCalculator: true,
    healthMetrics: true,
    nearbyClinics: true,
    profileSettings: true,
  },
};

/**
 * Read the persisted email-notification preference.
 * @returns {boolean} Whether email notifications are enabled.
 */
export function getEmailNotificationsEnabled() {
  const stored = localStorage.getItem(EMAIL_NOTIFICATIONS_KEY);
  return stored !== 'false';
}

/**
 * Persist the email-notification preference.
 * @param {boolean} enabled
 * @returns {boolean}
 */
export function setEmailNotificationsEnabled(enabled) {
  const value = Boolean(enabled);
  localStorage.setItem(EMAIL_NOTIFICATIONS_KEY, value ? 'true' : 'false');
  return value;
}

/**
 * Read the persisted sound notifications preference.
 * @returns {boolean}
 */
export function getSoundNotificationsEnabled() {
  const stored = localStorage.getItem(SOUND_NOTIFICATIONS_KEY);
  return stored !== 'false';
}

/**
 * Persist the sound notifications preference.
 * @param {boolean} enabled
 * @returns {boolean}
 */
export function setSoundNotificationsEnabled(enabled) {
  const value = Boolean(enabled);
  localStorage.setItem(SOUND_NOTIFICATIONS_KEY, value ? 'true' : 'false');
  return value;
}

/**
 * Read the persisted dashboard preferences.
 * @returns {typeof DEFAULT_DASHBOARD_SETTINGS}
 */
export function getDashboardSettings() {
  try {
    const stored = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
    if (!stored) return DEFAULT_DASHBOARD_SETTINGS;
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...parsed,
      visibleCards: {
        ...DEFAULT_DASHBOARD_SETTINGS.visibleCards,
        ...(parsed.visibleCards || {}),
      },
    };
  } catch (err) {
    console.warn('Failed to parse dashboard settings:', err);
    return DEFAULT_DASHBOARD_SETTINGS;
  }
}

/**
 * Persist dashboard preferences.
 * @param {typeof DEFAULT_DASHBOARD_SETTINGS} settings
 * @returns {typeof DEFAULT_DASHBOARD_SETTINGS}
 */
export function setDashboardSettings(settings) {
  try {
    const updated = {
      ...DEFAULT_DASHBOARD_SETTINGS,
      ...settings,
      visibleCards: {
        ...DEFAULT_DASHBOARD_SETTINGS.visibleCards,
        ...(settings?.visibleCards || {}),
      },
    };
    localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save dashboard settings:', err);
    return DEFAULT_DASHBOARD_SETTINGS;
  }
}
