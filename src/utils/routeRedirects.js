/**
 * Route Redirects Safety Utility (Client-side)
 *
 * Implements a strict allowlist of application paths for safe redirection.
 * Protects against Open Redirects and SSRF bypassing.
 */

// Strict allowlist of valid application paths (base paths without query/hash)
const ALLOWED_PATHS = new Set([
  '/',
  '/dashboard',
  '/medicine-tracker',
  '/symptom-checker',
  '/clinics-nearby',
  '/dosage-calculator',
  '/health-metrics',
  '/settings',
  '/login',
  '/profile',
  '/recommendations'
]);

/**
 * Validates a given redirect URL against the strict allowlist.
 * Ensures the path does not use backslashes or encoded double slashes.
 *
 * @param {unknown} raw - Untrusted redirect target.
 * @param {string} defaultPath - Fallback path if validation fails.
 * @returns {string} - The validated, safe redirect path.
 */
export function getValidatedRedirect(raw, defaultPath = '/dashboard') {
  if (typeof raw !== 'string') return defaultPath;
  
  const value = raw.trim();
  if (!value) return defaultPath;

  // Block protocol-relative URLs (e.g., "//evil.com")
  if (value.startsWith('//')) return defaultPath;

  // Enforce relative path starting with single slash
  if (!value.startsWith('/')) return defaultPath;

  // Explicitly block backslashes
  if (value.includes('\\')) return defaultPath;

  // Explicitly block encoded double slashes
  if (/%2f%2f/i.test(value)) return defaultPath;

  // Disallow scheme prefixes (e.g. javascript:, http:, data:)
  if (/^(?:[a-z][a-z0-9+.-]*):/i.test(value)) return defaultPath;

  try {
    // We use a dummy base URL to parse the path properly
    const parsed = new URL(value, 'http://localhost');
    const pathname = parsed.pathname;

    if (ALLOWED_PATHS.has(pathname)) {
      // Reconstruct the allowed URL with its original query/hash params if present.
      // E.g. /profile?tab=1 -> pathname is /profile, valid! return original value.
      return value;
    }
  } catch (err) {
    // If parsing fails for any reason, return default
    return defaultPath;
  }

  return defaultPath;
}

/**
 * Convenience method for extracting and validating a redirect from URLSearchParams
 *
 * @param {URLSearchParams} params
 * @param {string[]} keys - Keys to look for (e.g., ['redirectUrl', 'next'])
 * @param {string} defaultPath
 * @returns {string}
 */
export function getRedirectFromParams(params, keys = ['redirectUrl', 'next'], defaultPath = '/dashboard') {
  if (!params) return defaultPath;
  
  for (const key of keys) {
    const val = params.get(key);
    if (val) {
      return getValidatedRedirect(val, defaultPath);
    }
  }
  
  return defaultPath;
}
