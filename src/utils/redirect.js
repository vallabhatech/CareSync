/**
 * Redirect URL safety helpers (client-side).
 *
 * Goal: prevent open redirects and XSS vectors that can arise from using
 * untrusted redirect targets in client navigation.
 *
 * Policy:
 * - Allow only internal paths (relative to the current origin).
 * - Require the input to start with a single leading slash.
 * - Explicitly block protocol-relative URLs ("//example.com").
 * - Explicitly block scheme-based URLs ("http:", "https:", "javascript:", "data:", etc.).
 */

const SAFE_INTERNAL_PATH_REGEX = /^\/[A-Za-z0-9._~\-/?#[\]@!$&'()*+,;=%:]*$/;

/**
 * Returns a sanitized internal path suitable for react-router navigate/link.
 *
 * @param {unknown} raw - Untrusted redirect target (e.g. from query param).
 * @param {string} defaultPath - Path to use when input is invalid.
 * @returns {string}
 */
export function sanitizeRedirect(raw, defaultPath = '/') {
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (!value) return defaultPath;

  // Block protocol-relative URLs early: "//evil.com"
  // Note: a legitimate internal absolute path always starts with exactly one '/'.
  if (value.startsWith('//')) return defaultPath;

  // Only allow strings that start with a single '/' (absolute path on this origin)
  if (!value.startsWith('/')) return defaultPath;

  // Disallow backslashes commonly used in bypass attempts
  if (value.includes('\\')) return defaultPath;

  // Disallow scheme-like prefixes anywhere in the path
  // (e.g., "javascript:", "data:", "http:")
  if (/^(?:[a-z][a-z0-9+.-]*):/i.test(value)) return defaultPath;

  // Extra conservative block: deny any percent-encoded double-slash sequences
  // that could help reach external origins when decoded somewhere else.
  // (This is intentionally strict.)
  if (/%2f%2f/i.test(value)) return defaultPath;

  // Ensure the path only contains a safe, conservative character set.
  // This prevents weird control characters and HTML-ish payloads.
  if (!SAFE_INTERNAL_PATH_REGEX.test(value)) return defaultPath;

  return value;
}

/**
 * Convenience for query params in router pages.
 *
 * @param {URLSearchParams} params
 * @param {string} key
 * @param {string} defaultPath
 */
export function getSanitizedRedirectFromParams(params, key = 'redirect', defaultPath = '/') {
  try {
    const raw = params?.get ? params.get(key) : '';
    return sanitizeRedirect(raw, defaultPath);
  } catch {
    return defaultPath;
  }
}

