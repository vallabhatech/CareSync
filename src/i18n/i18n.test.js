/**
 * Unit tests for src/i18n.js and the locale resource bundles.
 *
 * Verifies:
 *  - i18next initialises and exposes the configured languages
 *  - the t() function resolves namespaced keys in English (default)
 *  - switching to Hindi resolves the same keys to Hindi strings
 *  - interpolation (e.g. {{count}}, {{year}}) works
 *  - the en and hi locale files have identical key structures, so no
 *    string is left untranslated when a contributor adds a language
 */

import i18n, { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from '../i18n';
import en from './locales/en.json';
import hi from './locales/hi.json';

/** Recursively collect dot-joined leaf key paths from a nested object. */
function leafKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? leafKeys(value, path)
      : [path];
  });
}

beforeAll(async () => {
  // Ensure i18n is initialised before assertions (init is async).
  if (!i18n.isInitialized) {
    await new Promise((resolve) => i18n.on('initialized', resolve));
  }
  await i18n.changeLanguage('en');
});

describe('i18n configuration', () => {
  test('exposes the supported languages (English + Hindi)', () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
  });

  test('uses the expected localStorage key for persistence', () => {
    expect(LANGUAGE_STORAGE_KEY).toBe('caresync_language');
  });

  test('falls back to English', () => {
    expect(i18n.options.fallbackLng).toEqual(expect.arrayContaining(['en']));
  });
});

describe('t() translation function', () => {
  test('resolves namespaced keys in English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common:appName')).toBe('CareSync');
    expect(i18n.t('nav:dashboard')).toBe('Dashboard');
    expect(i18n.t('settings:language')).toBe('Language');
  });

  test('resolves the same keys in Hindi after changeLanguage', async () => {
    await i18n.changeLanguage('hi');
    expect(i18n.t('nav:dashboard')).toBe('डैशबोर्ड');
    expect(i18n.t('settings:language')).toBe('भाषा');
    // Reset for any later tests.
    await i18n.changeLanguage('en');
  });

  test('supports interpolation', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('footer:copyright', { year: 2026 })).toContain('2026');
    expect(i18n.t('symptom:riskLabel', { level: 'High' })).toBe('High Risk');
  });

  test('supports pluralisation for medicine count', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('dashboard:todaysMedicines', { count: 1 })).toBe('1 medicine scheduled for today.');
    expect(i18n.t('dashboard:todaysMedicines', { count: 3 })).toBe('3 medicines scheduled for today.');
  });
});

describe('locale resource integrity', () => {
  test('English and Hindi have identical key structures', () => {
    const enKeys = leafKeys(en).sort();
    const hiKeys = leafKeys(hi).sort();
    expect(hiKeys).toEqual(enKeys);
  });

  test('no Hindi value is empty', () => {
    const check = (obj) => {
      Object.values(obj).forEach((v) => {
        if (v && typeof v === 'object') check(v);
        else expect(String(v).trim().length).toBeGreaterThan(0);
      });
    };
    check(hi);
  });
});
