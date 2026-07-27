/**
 * Shared hostname and IP normalization for SSRF guards and NO_PROXY matching.
 * Canonical forms prevent bypass via alternate IP encodings or suffix tricks.
 */

export const LOOPBACK_ALIASES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
]);

/**
 * Normalizes an IPv4 address from dotted-decimal, decimal, hex, octal, or mixed
 * representations into standard dotted-decimal notation.
 *
 * @param {string} ip
 * @returns {string|null}
 */
export function normalizeIPv4(ip) {
  if (!ip || typeof ip !== 'string' || ip.includes(':')) {
    return null;
  }

  const parts = ip.split('.').filter(p => p !== '');
  if (parts.length > 4) {
    return null;
  }

  try {
    let octets = parts.map((part) => {
      let val;
      if (/^0x[0-9a-f]+$/i.test(part)) {
        val = Number.parseInt(part, 16);
      } else if (/^0[0-7]+$/.test(part) && part.length > 1) {
        val = Number.parseInt(part, 8);
      } else if (/^\d+$/.test(part)) {
        val = Number.parseInt(part, 10);
      } else {
        return null;
      }
      if (val < 0) {
        return null;
      }
      return val;
    });

    if (octets.includes(null)) {
      return null;
    }

    if (octets.length < 4) {
      const last = octets.pop() ?? 0;
      const maxLast = Math.pow(256, 4 - octets.length) - 1;
      if (last > maxLast) return null;
      const remaining = 4 - octets.length;
      for (let i = 0; i < remaining; i++) {
        octets.push((last >>> (8 * (remaining - 1 - i))) & 0xff);
      }
    }
    // Ensure final array has 4 elements and all are valid octets
    if (octets.length !== 4 || octets.some(o => o > 255)) return null;

    return octets.join('.');
  } catch {
    return null;
  }
}

/**
 * Normalizes an IPv6 address into a lowercase canonical form without brackets.
 *
 * @param {string} ip
 * @returns {string|null}
 */
export function normalizeIPv6(ip) {
  if (!ip || typeof ip !== 'string' || !ip.includes(':')) {
    return null;
  }

  const bare = ip.startsWith('[') && ip.endsWith(']') ? ip.slice(1, -1) : ip;

  try {
    const testUrl = new URL(`http://[${bare}]/`);
    const raw = testUrl.hostname;
    return (raw.startsWith('[') ? raw.slice(1, -1) : raw).toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Normalizes a hostname for secure equality and suffix checks.
 *
 * @param {string} hostname
 * @returns {{ hostname: string, ipv4: string|null, ipv6: string|null }}
 */
export function normalizeHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return { hostname: '', ipv4: null, ipv6: null };
  }

  let lower = hostname.toLowerCase();
  if (lower.endsWith('.')) {
    lower = lower.slice(0, -1);
  }
  const ipv4 = normalizeIPv4(lower);
  if (ipv4) {
    return { hostname: ipv4, ipv4, ipv6: null };
  }

  const ipv6 = normalizeIPv6(lower);
  if (ipv6) {
    return { hostname: ipv6, ipv4: null, ipv6 };
  }

  return { hostname: lower, ipv4: null, ipv6: null };
}

/**
 * @param {string} hostname
 * @returns {boolean}
 */
export function isLoopbackAlias(hostname) {
  let lower = String(hostname || '').toLowerCase();
  if (lower.endsWith('.')) {
    lower = lower.slice(0, -1);
  }
  return LOOPBACK_ALIASES.has(lower);
}

/**
 * Returns true when two host identifiers refer to the same host after normalization.
 *
 * @param {string} left
 * @param {string} right
 * @returns {boolean}
 */
export function hostnamesMatch(left, right) {
  const a = normalizeHostname(left);
  const b = normalizeHostname(right);

  if (a.ipv4 && b.ipv4) {
    return a.ipv4 === b.ipv4;
  }
  if (a.ipv6 && b.ipv6) {
    return a.ipv6 === b.ipv6;
  }

  return a.hostname === b.hostname;
}
