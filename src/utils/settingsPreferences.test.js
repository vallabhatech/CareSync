/**
 * Unit tests for src/utils/settingsPreferences.js
 *
 * Verifies the email-notification preference read/write helpers and their
 * persistence semantics (default-on, explicit-false disables, round-trips
 * survive a simulated reload).
 */

import {
  EMAIL_NOTIFICATIONS_KEY,
  getEmailNotificationsEnabled,
  setEmailNotificationsEnabled,
} from './settingsPreferences';

/* ------------------------------------------------------------------ */
/*  localStorage mock                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  getEmailNotificationsEnabled                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  setEmailNotificationsEnabled                                       */
/* ------------------------------------------------------------------ */

describe('setEmailNotificationsEnabled', () => {
  test('persists true under the documented key', () => {
    setEmailNotificationsEnabled(true);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('true');
  });

  test('persists false under the documented key', () => {
    setEmailNotificationsEnabled(false);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('false');
  });

  test('coerces truthy/falsy inputs to a strict boolean string', () => {
    setEmailNotificationsEnabled(0);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('false');
    setEmailNotificationsEnabled(1);
    expect(localStorage.getItem(EMAIL_NOTIFICATIONS_KEY)).toBe('true');
  });

  test('returns the stored boolean value', () => {
    expect(setEmailNotificationsEnabled(true)).toBe(true);
    expect(setEmailNotificationsEnabled(false)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Round-trip (survives a simulated reload)                           */
/* ------------------------------------------------------------------ */

describe('round-trip persistence', () => {
  test('a disabled preference is still disabled after a reload', () => {
    setEmailNotificationsEnabled(false);
    // Simulate a fresh page load: a new getter reads the same backing store.
    expect(getEmailNotificationsEnabled()).toBe(false);
  });

  test('a re-enabled preference is read back as enabled', () => {
    setEmailNotificationsEnabled(false);
    setEmailNotificationsEnabled(true);
    expect(getEmailNotificationsEnabled()).toBe(true);
  });
});
