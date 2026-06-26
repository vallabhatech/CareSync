import { sanitizeRedirect } from './redirect';

describe('sanitizeRedirect', () => {
  test('allows internal absolute paths', () => {
    expect(sanitizeRedirect('/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirect('/profile?x=1&y=2')).toBe('/profile?x=1&y=2');
    expect(sanitizeRedirect('/settings#section-1')).toBe('/settings#section-1');
  });

  test('blocks protocol-relative redirect attempts', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/');
    expect(sanitizeRedirect('////evil.com')).toBe('/');
  });

  test('blocks non-path and scheme based inputs', () => {
    expect(sanitizeRedirect('http://evil.com')).toBe('/');
    expect(sanitizeRedirect('https://evil.com')).toBe('/');
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirect('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('/');
  });

  test('blocks backslash and encoded double-slash bypass', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBe('/');
    expect(sanitizeRedirect('/%2F%2Fevil.com')).toBe('/');
  });

  test('blocks malformed or unsafe chars', () => {
    // Basic control char injection attempt
    expect(sanitizeRedirect('/dashboard\n<script>')).toBe('/');
    // Spaces are not allowed by the safe regex
    expect(sanitizeRedirect('/my page')).toBe('/');
  });
});

