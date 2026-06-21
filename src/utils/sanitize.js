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

/**
 * Validates and normalizes request headers to prevent CRLF injection,
 * prototype pollution derived headers, and malformed header names.
 *
 * @param {Object} headers - The headers object to validate.
 * @returns {Object} The normalized and validated headers.
 * @throws {Error} If any header name or value is invalid/malicious.
 */
export function validateAndNormalizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return {};
  }

  const cleanHeaders = Object.create(null);

  for (const [key, value] of Object.entries(headers)) {
    const trimmedKey = key.trim();
    const keyLower = trimmedKey.toLowerCase();

    // 1. Reject prototype pollution derived headers
    if (
      keyLower === '__proto__' ||
      keyLower === 'constructor' ||
      keyLower === 'prototype' ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype' ||
      !Object.prototype.hasOwnProperty.call(headers, key)
    ) {
      throw new Error(`Invalid header name: "${trimmedKey}" (blocked prototype key)`);
    }

    // 2. Reject malformed header names (RFC 7230 token definition)
    const validHeaderNameRegex = /^[a-zA-Z0-9!#$%&'*+\-.^_`|~]+$/;
    if (!validHeaderNameRegex.test(trimmedKey)) {
      throw new Error(`Malformed header name: "${trimmedKey}"`);
    }

    // 3. Normalize values and reject injection
    let normalizedValue = value;
    if (value === null || value === undefined) {
      normalizedValue = '';
    } else if (Array.isArray(value)) {
      normalizedValue = value.map(v => {
        const strVal = String(v).trim();
        // Reject CRLF injection
        if (/[\r\n]/.test(strVal)) {
          throw new Error(`CRLF injection detected in header value for key "${trimmedKey}"`);
        }
        // Reject other control characters to prevent header injection/evasion
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\x1F\x7F]/.test(strVal)) {
          throw new Error(`Control characters detected in header value for key "${trimmedKey}"`);
        }
        return strVal;
      });
    } else {
      normalizedValue = String(value).trim();
      // Reject CRLF injection
      if (/[\r\n]/.test(normalizedValue)) {
        throw new Error(`CRLF injection detected in header value for key "${trimmedKey}"`);
      }
      // Reject other control characters to prevent header injection/evasion
      // eslint-disable-next-line no-control-regex
      if (/[\x00-\x1F\x7F]/.test(normalizedValue)) {
        throw new Error(`Control characters detected in header value for key "${trimmedKey}"`);
      }
    }

    cleanHeaders[trimmedKey] = normalizedValue;
  }

  return cleanHeaders;
}
