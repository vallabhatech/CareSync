/**
 * Deep sanitizes an object by removing prototype pollution vectors.
 * Recursively rejects any keys matching:
 * - __proto__
 * - constructor
 * - prototype
 *
 * @param {*} obj - The input value to sanitize.
 * @returns {*} The sanitized copy of the input.
 */
export function sanitizeConfig(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(sanitizeConfig);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.trim().toLowerCase();
    
    // Check for dangerous keys
    if (
      keyLower === '__proto__' ||
      keyLower === 'constructor' ||
      keyLower === 'prototype' ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      console.warn(`Prototype pollution attempt blocked. Rejected key: "${key}"`);
      continue;
    }

    sanitized[key] = sanitizeConfig(value);
  }

  return sanitized;
}
