/**
 * Unit tests for src/utils/settingsPreferences.js
 */

import {
  EMAIL_NOTIFICATIONS_KEY,
  getEmailNotificationsEnabled,
  setEmailNotificationsEnabled,
  getSoundNotificationsEnabled,
  setSoundNotificationsEnabled,
  getDashboardSettings,
  setDashboardSettings,
  DEFAULT_DASHBOARD_SETTINGS,
} from './settingsPreferences';

beforeEach(() => {
  const store = {};
  const mockLocalStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
});

describe('getEmailNotificationsEnabled', () => {
  test('defaults to true when nothing is stored', () => {
    expect(getEmailNotificationsEnabled()).toBe(true);
  });

  test('returns true when stored value is "true"', () => {
    localStorage.setItem(EMAIL_NOTIFICATIONS_KEY, 'true');
    expect(getEmailNotificationsEnabled()).toBe(true);
  });

  test('returns false only when stored value is explicitly "false"', () => {
    localStorage.setItem(EMAIL_NOTIFICATIONS_KEY, 'false');
    expect(getEmailNotificationsEnabled()).toBe(false);
  });
});

describe('setEmailNotificationsEnabled', () => {
  test('persists true under the documented key', () => {
    setEmailNotificationsEnabled(true);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('true');
  });

  test('persists false under the documented key', () => {
    setEmailNotificationsEnabled(false);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('false');
  });
});

describe('sound notifications preference', () => {
  test('defaults to true when nothing is stored', () => {
    expect(getSoundNotificationsEnabled()).toBe(true);
  });

  test('persists sound notification toggle', () => {
    setSoundNotificationsEnabled(false);
    expect(getSoundNotificationsEnabled()).toBe(false);
    setSoundNotificationsEnabled(true);
    expect(getSoundNotificationsEnabled()).toBe(true);
  });
});

describe('dashboard settings preference', () => {
  test('returns default settings when nothing stored', () => {
    const settings = getDashboardSettings();
    expect(settings.showGreeting).toBe(true);
    expect(settings.showHealthQuote).toBe(true);
    expect(settings.showStatsRow).toBe(true);
    expect(settings.visibleCards.todaysMedicines).toBe(true);
  });

  test('persists and reads back custom dashboard settings', () => {
    const custom = {
      showGreeting: false,
      showHealthQuote: false,
      showStatsRow: true,
      visibleCards: {
        todaysMedicines: true,
        recentSymptomChecks: false,
      },
    };
    setDashboardSettings(custom);
    const readBack = getDashboardSettings();
    expect(readBack.showGreeting).toBe(false);
    expect(readBack.showHealthQuote).toBe(false);
    expect(readBack.showStatsRow).toBe(true);
    expect(readBack.visibleCards.recentSymptomChecks).toBe(false);
    expect(readBack.visibleCards.todaysMedicines).toBe(true);
  });
});
