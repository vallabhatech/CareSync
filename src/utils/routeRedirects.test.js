import { getValidatedRedirect, getRedirectFromParams } from './routeRedirects';

describe('routeRedirects utilities', () => {
  describe('getValidatedRedirect', () => {
    test('allows strict allowlisted paths', () => {
      expect(getValidatedRedirect('/dashboard')).toBe('/dashboard');
      expect(getValidatedRedirect('/profile')).toBe('/profile');
      expect(getValidatedRedirect('/settings')).toBe('/settings');
    });

    test('allows allowlisted paths with query strings or hashes', () => {
      expect(getValidatedRedirect('/profile?x=1&y=2')).toBe('/profile?x=1&y=2');
      expect(getValidatedRedirect('/settings#section-1')).toBe('/settings#section-1');
      expect(getValidatedRedirect('/clinics-nearby?query=New+York')).toBe('/clinics-nearby?query=New+York');
    });

    test('blocks paths not in the allowlist', () => {
      expect(getValidatedRedirect('/unknown')).toBe('/dashboard');
      expect(getValidatedRedirect('/admin')).toBe('/dashboard');
      expect(getValidatedRedirect('/dashboard-old')).toBe('/dashboard');
    });

    test('blocks protocol-relative redirect attempts', () => {
      expect(getValidatedRedirect('//evil.com')).toBe('/dashboard');
      expect(getValidatedRedirect('////evil.com')).toBe('/dashboard');
      expect(getValidatedRedirect('//malicious.com')).toBe('/dashboard');
    });

    test('blocks non-path and scheme based inputs', () => {
      expect(getValidatedRedirect('http://evil.com')).toBe('/dashboard');
      expect(getValidatedRedirect('https://evil.com')).toBe('/dashboard');
      expect(getValidatedRedirect('javascript:alert(1)')).toBe('/dashboard');
      expect(getValidatedRedirect('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('/dashboard');
    });

    test('blocks backslash and encoded double-slash bypass', () => {
      expect(getValidatedRedirect('/\\evil.com')).toBe('/dashboard');
      expect(getValidatedRedirect('/%2F%2Fevil.com')).toBe('/dashboard');
    });

    test('handles invalid inputs gracefully', () => {
      expect(getValidatedRedirect(null)).toBe('/dashboard');
      expect(getValidatedRedirect(undefined)).toBe('/dashboard');
      expect(getValidatedRedirect(123)).toBe('/dashboard');
      expect(getValidatedRedirect('')).toBe('/dashboard');
      expect(getValidatedRedirect('   ')).toBe('/dashboard');
    });
  });

  describe('getRedirectFromParams', () => {
    test('extracts redirectUrl parameter and validates it', () => {
      const params = new URLSearchParams('?redirectUrl=/profile&other=123');
      expect(getRedirectFromParams(params)).toBe('/profile');
    });

    test('extracts next parameter if redirectUrl is missing', () => {
      const params = new URLSearchParams('?next=/settings');
      expect(getRedirectFromParams(params)).toBe('/settings');
    });

    test('falls back to default path if params are malicious', () => {
      const params = new URLSearchParams('?redirectUrl=//malicious.com');
      expect(getRedirectFromParams(params)).toBe('/dashboard');
    });

    test('falls back to default path if no target param is present', () => {
      const params = new URLSearchParams('?other=123');
      expect(getRedirectFromParams(params)).toBe('/dashboard');
    });
  });
});
