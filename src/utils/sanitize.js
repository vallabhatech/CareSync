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

/**
 * Allowed outbound protocols. Anything else is rejected to prevent
 * file://, ftp://, gopher://, javascript://, etc. abuse.
 */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

/**
 * Cloud/hypervisor metadata endpoints commonly targeted in SSRF attacks.
 * Patterns are matched case-insensitively against the request hostname.
 */
const METADATA_HOSTNAMES = [
  '169.254.169.254',   // AWS, GCP, Azure IMDS
  '100.100.100.200',   // Alibaba Cloud metadata
  'fd00:ec2::254',     // AWS IPv6 metadata
  'metadata.google.internal',
  'metadata.goog',
];

/**
 * Rejects URLs targeting localhost, loopback addresses, private RFC-1918
 * ranges, link-local addresses, APIPA ranges, or cloud metadata endpoints.
 *
 * Bypass vectors explicitly covered:
 * - Decimal / hex / octal IP encoding   (e.g. 0x7f000001, 0177.0.0.1)
 * - IPv6 loopback                        (::1, [::1])
 * - IPv6 mapped IPv4                     (::ffff:127.0.0.1)
 * - URL-encoded octets                   (%31%32%37...)
 * - Protocol abuse                       (file://, ftp://, gopher://)
 * - Metadata service hostnames
 *
 * @param {string} rawUrl - The URL string to validate.
 * @throws {Error} If the URL is disallowed.
 * @returns {URL}  The parsed URL object for further use.
 */
export function validateUrl(rawUrl) {
  // ── 1. Must be a non-empty string ─────────────────────────────────────────
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('URL validation failed: URL must be a non-empty string.');
  }

  // ── 2. Parse (also normalizes percent-encoding, resolves IPv6 brackets) ───
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`URL validation failed: Malformed URL "${rawUrl}".`);
  }

  // ── 3. Protocol allowlist ──────────────────────────────────────────────────
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `URL validation failed: Protocol "${parsed.protocol}" is not allowed. Only http: and https: are permitted.`
    );
  }

  // ── 4. Extract and normalise hostname ─────────────────────────────────────
  // parsed.hostname strips brackets from IPv6 addresses ([::1] → ::1)
  const hostname = parsed.hostname.toLowerCase();

  // ── 5. Metadata endpoint blocklist ────────────────────────────────────────
  for (const blocked of METADATA_HOSTNAMES) {
    if (hostname === blocked.toLowerCase()) {
      throw new Error(
        `URL validation failed: Access to cloud metadata endpoint "${hostname}" is forbidden.`
      );
    }
  }

  // ── 6. Attempt to parse as an IP address and test private/loopback ranges ─
  const ip = hostname;

  // 6a. IPv6 loopback and mapped-IPv4 ────────────────────────────────────────
  if (_isBlockedIPv6(ip)) {
    throw new Error(
      `URL validation failed: IPv6 address "${ip}" resolves to a blocked (loopback/private) range.`
    );
  }

  // 6b. Numeric IPv4 (standard dotted-decimal, decimal, hex, octal) ──────────
  const ipv4 = _normalizeIPv4(ip);
  if (ipv4 !== null && _isBlockedIPv4(ipv4)) {
    throw new Error(
      `URL validation failed: IP address "${ip}" resolves to a blocked (loopback/private/link-local) range.`
    );
  }

  // ── 7. Reject "localhost" and common alias hostnames ──────────────────�function _isBlockedIPv6(ip) {
  // Must contain a colon to be IPv6 (covers both "[::1]" and "::1")
  if (!ip.includes(':')) return false;

  // Node.js URL parser returns hostnames for IPv6 addresses WITH brackets,
  // e.g. parsed.hostname === "[fe80::1]". Strip them before processing.
  const bare = ip.startsWith('[') && ip.endsWith(']')
    ? ip.slice(1, -1)
    : ip;

  // Normalise the bare address through the URL parser so abbreviated forms
  // (e.g. "::1") are retained consistently. We wrap in brackets for the URL.
  let normalised;
  try {
    const testUrl = new URL(`http://[${bare}]/`);
    // .hostname returns with brackets; strip them again.
    const raw = testUrl.hostname;
    normalised = (raw.startsWith('[') ? raw.slice(1, -1) : raw).toLowerCase();
  } catch {
    // URL parser rejected the address — treat it as malformed and block it.
    throw new Error(`URL validation failed: Malformed IPv6 address "${ip}".`);
  }

  // ── Loopback ::1 ──────────────────────────────────────────────────────────
  if (normalised === '::1') return true;

  // ── All-zeros / unspecified :: ────────────────────────────────────────────
  if (normalised === '::' || /^::0*$/.test(normalised)) return true;

  // ── Link-local fe80::/10  (fe80 – febf) ──────────────────────────────────
  if (/^fe[89ab][0-9a-f]:/i.test(normalised)) return true;

  // ── Unique local fc00::/7  (fc00 – fdff) ─────────────────────────────────
  if (/^f[cd][0-9a-f]{2}:/i.test(normalised)) return true;

  // ── IPv4-mapped ::ffff:<hex16>:<hex16> ───────────────────────────────────
  // Node.js URL parser normalises [::ffff:127.0.0.1] → "::ffff:7f00:1"
  // i.e. two 16-bit hex groups rather than dotted-decimal.
  const mappedHexMatch = normalised.match(
    /^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i
  );
  if (mappedHexMatch) {
    const hi = parseInt(mappedHexMatch[1], 16);
    const lo = parseInt(mappedHexMatch[2], 16);
    const a = (hi >> 8) & 0xff;
    const b = hi & 0xff;
    const c = (lo >> 8) & 0xff;
    const d = lo & 0xff;
    const dotted = `${a}.${b}.${c}.${d}`;
    if (_isBlockedIPv4(dotted)) return true;
  }

  // ── IPv4-mapped in dotted-decimal notation (fallback) ─────────────────────
  const mappedDottedMatch = normalised.match(/^::(?:ffff:)?([\d.]+)$/i);
  if (mappedDottedMatch) {
    const ipv4 = _normalizeIPv4(mappedDottedMatch[1]);
    if (ipv4 !== null && _isBlockedIPv4(ipv4)) return true;
  }

  return false;
}

f]{2}:/i.test(normalised)) return true;

  // ── IPv4-mapped ::ffff:<hex16>:<hex16> ───────────────────────────────────
  // Node.js URL parser normalises [::ffff:127.0.0.1] → "::ffff:7f00:1"
  // i.e. two 16-bit hex groups rather than dotted-decimal.
  const mappedHexMatch = normalised.match(
    /^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i
  );
  if (mappedHexMatch) {
    const hi = parseInt(mappedHexMatch[1], 16);
    const lo = parseInt(mappedHexMatch[2], 16);
    const a = (hi >> 8) & 0xff;
    const b = hi & 0xff;
    const c = (lo >> 8) & 0xff;
    const d = lo & 0xff;
    const dotted = `${a}.${b}.${c}.${d}`;
    if (_isBlockedIPv4(dotted)) return true;
  }

  // ── IPv4-mapped in dotted-decimal notation (some environments) ────────────
  const mappedDottedMatch = normalised.match(/^::(?:ffff:)?([\d.]+)$/i);
  if (mappedDottedMatch) {
    const ipv4 = _normalizeIPv4(mappedDottedMatch[1]);
    if (ipv4 !== null && _isBlockedIPv4(ipv4)) return true;
  }

  return false;
}


/**
 * Normalizes an IPv4 address from any representation (dotted-decimal,
 * decimal, hex, octal, mixed) into standard dotted-decimal notation.
 * Returns null when the string is not a recognisable IPv4 address.
 *
 * @param {string} ip
 * @returns {string|null} Dotted-decimal string like "192.168.1.1" or null.
 */
function _normalizeIPv4(ip) {
  // Must not contain colons (would be IPv6)
  if (ip.includes(':')) return null;

  // Split on dots
  const parts = ip.split('.');
  if (parts.length < 1 || parts.length > 4) return null;

  try {
    const octets = parts.map((part) => {
      let val;
      if (/^0x[0-9a-f]+$/i.test(part)) {
        // Hexadecimal: 0x7f
        val = parseInt(part, 16);
      } else if (/^0[0-7]+$/.test(part) && part.length > 1) {
        // Octal: 0177
        val = parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        val = parseInt(part, 10);
      } else {
        // Not a valid numeric part → not an IP
        return null;
      }
      if (val < 0 || val > 255) return null;
      return val;
    });

    if (octets.some((o) => o === null)) return null;

    // Fewer than 4 parts: classful expansion (e.g. 2130706433 → 127.0.0.1)
    // Expand to 4 octets
    while (octets.length < 4) {
      const last = octets.pop();
      octets.push(last & 0xff);
      octets.unshift((last >> 8) & 0xff);
    }

    return octets.join('.');
  } catch {
    return null;
  }
}

/**
 * Returns true for IPv4 ranges that must never be reached by
 * server-side or client-initiated SSRF requests:
 * - 127.0.0.0/8  loopback
 * - 10.0.0.0/8   private
 * - 172.16.0.0/12 private
 * - 192.168.0.0/16 private
 * - 169.254.0.0/16 link-local / APIPA
 * - 0.0.0.0/8    "this network"
 * - 100.64.0.0/10 shared address (RFC 6598)
 * - 198.18.0.0/15 benchmark testing (RFC 2544)
 * - 240.0.0.0/4  reserved
 *
 * @param {string} dotted - Standard dotted-decimal IPv4, e.g. "192.168.1.1"
 * @returns {boolean}
 */
function _isBlockedIPv4(dotted) {
  const [a, b, c] = dotted.split('.').map(Number);
  return (
    a === 0 ||                                     // 0.0.0.0/8
    a === 10 ||                                    // 10.0.0.0/8
    a === 127 ||                                   // 127.0.0.0/8
    (a === 169 && b === 254) ||                    // 169.254.0.0/16
    (a === 172 && b >= 16 && b <= 31) ||           // 172.16.0.0/12
    (a === 192 && b === 168) ||                    // 192.168.0.0/16
    (a === 100 && b >= 64 && b <= 127) ||          // 100.64.0.0/10
    (a === 198 && (b === 18 || b === 19)) ||       // 198.18.0.0/15
    a >= 240                                       // 240.0.0.0/4 reserved
  );
}
