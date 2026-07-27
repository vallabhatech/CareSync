import { hostnamesMatch, normalizeHostname, normalizeIPv4, normalizeIPv6 } from './hostNormalizer';

const DEFAULT_PORTS = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
};

/**
 * Reads proxy-related environment variables without mutating process.env.
 *
 * @param {string} key
 * @param {Record<string, string|undefined>} [env]
 * @returns {string}
 */
export function getProxyEnv(key, env = typeof process !== 'undefined' ? process.env : {}) {
  const lowerKey = key.toLowerCase();
  for (const k in env) {
    if (Object.hasOwn(env, k) && k.toLowerCase() === lowerKey) {
      return env[k] || '';
    }
  }
  return '';
}

/**
 * Validates and normalizes a single NO_PROXY entry.
 * Rejects wildcard patterns that are broader than "*.domain.tld".
 *
 * @param {string} entry
 * @returns {{ type: 'all'|'wildcard'|'host', raw: string, host?: string, suffix?: string, port?: number }}
 */
export function parseNoProxyEntry(entry) {
  const raw = entry.trim();
  if (!raw) {
    throw new Error('NO_PROXY entry must not be empty.');
  }

  if (raw === '*') {
    return { type: 'all', raw };
  }

  // Handle wildcard entries like "*.example.com"
  if (raw.includes('*')) {
    // A valid wildcard must be a suffix pattern, e.g., "*.example.com".
    if (raw.startsWith('*.')) {
      const suffix = raw.slice(1).toLowerCase();
      // The suffix must contain at least one more dot, ensuring it's not a bare TLD like "*.com".
      // e.g., ".example.com" is valid, but ".com" is not.
      if (!suffix.substring(1).includes('.')) {
        throw new Error(
          `Invalid NO_PROXY wildcard "${raw}". Suffix must include a domain and TLD (e.g. "*.example.com").`
        );
      }
      return { type: 'wildcard', raw, suffix };
    }
    // Reject other wildcard patterns like "foo.*.com" or "foo*bar".
    throw new Error(
      `Invalid NO_PROXY wildcard "${raw}". Only "*.example.com" suffix patterns are allowed.`
    );
  }

  // Protect against ridiculously long NO_PROXY entries
  if (raw.length > 256) {
    throw new Error(`NO_PROXY entry too long: "${raw.slice(0, 64)}..."`);
  }
  // Regex to capture host and port from entries like "example.com:8080".
  // Bracketed IPv6 literals such as "[::1]:8080" are supported separately.
  const bracketedPortMatch = /^\[(.+)\]:(\d{1,5})$/.exec(raw);
  const hostPortMatch = !raw.startsWith('[') ? /^([^:]+):(\d{1,5})$/.exec(raw) : null;
  const portMatch = bracketedPortMatch || hostPortMatch;

  let hostPart = raw;
  let port;
  if (portMatch) {
    hostPart = portMatch[1];
    port = Number.parseInt(portMatch[2], 10);
  }

  if (port !== undefined && (Number.isNaN(port) || port < 1 || port > 65535)) {
    throw new Error(`Invalid NO_PROXY port in entry "${raw}".`);
  }
  if (hostPart.length > 253) {
    throw new Error(`NO_PROXY host part too long in entry "${raw}".`);
  }

  return { type: 'host', raw, host: hostPart.toLowerCase(), port };
}

/**
 * Parses a NO_PROXY string into validated entries.
 *
 * @param {string} noProxyString
 * @returns {ReturnType<typeof parseNoProxyEntry>[]}
 */
export function parseNoProxyList(noProxyString) {
  if (!noProxyString || typeof noProxyString !== 'string') {
    return [];
  }

  return noProxyString
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(parseNoProxyEntry);
}

/**
 * Determines whether a request host matches one NO_PROXY entry.
 *
 * @param {string} requestHost
 * @param {number} requestPort
 * @param {ReturnType<typeof parseNoProxyEntry>} entry
 * @returns {boolean}
 */
export function matchesNoProxyEntry(requestHost, requestPort, entry) {
  if (entry.type === 'all') {
    return true;
  }

  if (entry.port !== undefined && entry.port !== requestPort) {
    return false;
  }

  const normalizedRequest = normalizeHostname(requestHost);

  if (entry.type === 'wildcard') {
    const host = normalizedRequest.hostname;
    return host.endsWith(entry.suffix) && host.length > entry.suffix.length;
  }

  const normalizedEntry = normalizeHostname(entry.host);
  if (normalizedEntry.ipv4 && normalizedRequest.ipv4) {
    return normalizedEntry.ipv4 === normalizedRequest.ipv4;
  }
  if (normalizedEntry.ipv6 && normalizedRequest.ipv6) {
    return normalizedEntry.ipv6 === normalizedRequest.ipv6;
  }

  return hostnamesMatch(normalizedRequest.hostname, normalizedEntry.hostname);
}

/**
 * Returns true when the URL should bypass the configured HTTP(S) proxy.
 *
 * Security rules enforced:
 * - Hostnames and IPs are normalized before comparison.
 * - Alternate IPv4 encodings cannot evade NO_PROXY IP entries.
 * - Domain entries require exact matches; only "*.domain.tld" suffix wildcards are allowed.
 * - Bare "*" bypasses all hosts (standard NO_PROXY semantics).
 *
 * @param {string|URL} url
 * @param {{ noProxy?: string, env?: Record<string, string|undefined> }} [options]
 * @returns {boolean}
 */
export function shouldBypassProxy(url, options = {}) {
  const env = options.env || (typeof process !== 'undefined' ? process.env : {});
  const noProxyString = options.noProxy ?? getProxyEnv('no_proxy', env);
  const entries = parseNoProxyList(noProxyString);

  if (entries.length === 0) {
    return false;
  }

  const parsedUrl = typeof url === 'string' ? new URL(url) : url;
  const proto = parsedUrl.protocol.replace(':', '');
  const hostname = parsedUrl.hostname;
  const port = Number.parseInt(parsedUrl.port, 10) || DEFAULT_PORTS[proto] || 0;

  if (!hostname || !proto) {
    return false;
  }

  return entries.some((entry) => matchesNoProxyEntry(hostname, port, entry));
}

/**
 * Inverse of shouldBypassProxy for callers that prefer positive proxy routing.
 *
 * @param {string|URL} url
 * @param {{ noProxy?: string, env?: Record<string, string|undefined> }} [options]
 * @returns {boolean}
 */
export function shouldUseProxy(url, options = {}) {
  return !shouldBypassProxy(url, options);
}

/**
 * Resolves the proxy URL for a request using hardened NO_PROXY matching.
 *
 * @param {string|URL} url
 * @param {{ noProxy?: string, env?: Record<string, string|undefined> }} [options]
 * @returns {string}
 */
export function getProxyForUrl(url, options = {}) {
  const env = options.env || (typeof process !== 'undefined' ? process.env : {});
  const parsedUrl = typeof url === 'string' ? new URL(url) : url;
  const proto = parsedUrl.protocol.replace(':', '');

  if (!parsedUrl.hostname || !proto) {
    return '';
  }

  if (shouldBypassProxy(parsedUrl, { ...options, env })) {
    return '';
  }

  let proxy =
    getProxyEnv(`${proto}_proxy`, env) ||
    getProxyEnv('all_proxy', env);

  if (proxy && !proxy.includes('://')) {
    proxy = `${proto}://${proxy}`;
  }

  return proxy;
}

export { normalizeHostname, normalizeIPv4, normalizeIPv6 };
