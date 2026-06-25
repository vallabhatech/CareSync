import {
  getProxyForUrl,
  matchesNoProxyEntry,
  parseNoProxyEntry,
  parseNoProxyList,
  shouldBypassProxy,
  shouldUseProxy,
} from './proxyConfig';

describe('proxyConfig NO_PROXY parsing', () => {
  test('parses comma and whitespace separated entries', () => {
    expect(parseNoProxyList('127.0.0.1, localhost ,*.example.com')).toHaveLength(3);
  });

  test('rejects unsafe wildcard patterns', () => {
    expect(() => parseNoProxyEntry('*')).not.toThrow();
    expect(() => parseNoProxyEntry('*.com')).toThrow(/Invalid NO_PROXY wildcard/);
    expect(() => parseNoProxyEntry('internal*')).toThrow(/Invalid NO_PROXY wildcard/);
    expect(() => parseNoProxyEntry('*internal.example.com')).toThrow(/Invalid NO_PROXY wildcard/);
  });

  test('accepts bounded suffix wildcards', () => {
    const entry = parseNoProxyEntry('*.example.com');
    expect(entry.type).toBe('wildcard');
    expect(entry.suffix).toBe('.example.com');
  });
});

describe('proxyConfig hostname matching', () => {
  test('matches exact domain names only (prevents suffix abuse)', () => {
    const entry = parseNoProxyEntry('example.com');
    expect(matchesNoProxyEntry('example.com', 443, entry)).toBe(true);
    expect(matchesNoProxyEntry('api.example.com', 443, entry)).toBe(false);
    expect(matchesNoProxyEntry('notexample.com', 443, entry)).toBe(false);
  });

  test('matches bounded wildcard suffixes', () => {
    const entry = parseNoProxyEntry('*.example.com');
    expect(matchesNoProxyEntry('api.example.com', 443, entry)).toBe(true);
    expect(matchesNoProxyEntry('example.com', 443, entry)).toBe(false);
    expect(matchesNoProxyEntry('evilexample.com', 443, entry)).toBe(false);
  });

  test('honors explicit port restrictions', () => {
    const entry = parseNoProxyEntry('127.0.0.1:8080');
    expect(matchesNoProxyEntry('127.0.0.1', 8080, entry)).toBe(true);
    expect(matchesNoProxyEntry('127.0.0.1', 80, entry)).toBe(false);
  });
});

describe('proxyConfig alternate IP encoding bypass prevention', () => {
  const env = {
    NO_PROXY: '127.0.0.1,10.0.0.1,192.168.1.1,[::1]',
    HTTP_PROXY: 'http://proxy.internal:8080',
  };

  describe('IPv4 dotted-decimal', () => {
    test('bypasses proxy for canonical IPv4 NO_PROXY entries', () => {
      expect(shouldBypassProxy('http://127.0.0.1/', { env })).toBe(true);
      expect(shouldBypassProxy('http://10.0.0.1/', { env })).toBe(true);
      expect(shouldUseProxy('http://8.8.8.8/', { env })).toBe(true);
    });
  });

  describe('decimal encoded IPv4', () => {
    test('treats decimal-encoded loopback as matching 127.0.0.1', () => {
      expect(shouldBypassProxy('http://2130706433/', { env })).toBe(true);
    });

    test('treats decimal-encoded private addresses as matching NO_PROXY entries', () => {
      expect(shouldBypassProxy('http://167772161/', { env })).toBe(true);
    });
  });

  describe('octal encoded IPv4', () => {
    test('treats octal-encoded loopback as matching 127.0.0.1', () => {
      expect(shouldBypassProxy('http://0177.0.0.1/', { env })).toBe(true);
    });

    test('treats mixed octal dotted forms as matching canonical entries', () => {
      expect(shouldBypassProxy('http://0177.0.0.1/', { env })).toBe(true);
      expect(shouldBypassProxy('http://012.0.0.1/', { env })).toBe(true);
    });
  });

  describe('hexadecimal encoded IPv4', () => {
    test('treats hex-encoded loopback as matching 127.0.0.1', () => {
      expect(shouldBypassProxy('http://0x7f000001/', { env })).toBe(true);
    });

    test('treats per-octet hex forms as matching canonical entries', () => {
      expect(shouldBypassProxy('http://0x7f.0x0.0x0.0x1/', { env })).toBe(true);
    });
  });

  describe('IPv6', () => {
    test('bypasses proxy for IPv6 loopback when listed in NO_PROXY', () => {
      expect(shouldBypassProxy('http://[::1]/', { env })).toBe(true);
    });

    test('does not bypass proxy for public IPv6 hosts not listed in NO_PROXY', () => {
      expect(shouldBypassProxy('http://[2001:4860:4860::8888]/', { env })).toBe(false);
    });
  });
});

describe('proxyConfig routing behavior', () => {
  test('returns configured proxy when host is not in NO_PROXY', () => {
    const env = {
      NO_PROXY: '127.0.0.1',
      HTTP_PROXY: 'http://proxy.internal:8080',
    };

    expect(getProxyForUrl('http://example.com/', { env })).toBe('http://proxy.internal:8080');
  });

  test('returns empty proxy URL when host matches NO_PROXY', () => {
    const env = {
      NO_PROXY: '127.0.0.1',
      HTTP_PROXY: 'http://proxy.internal:8080',
    };

    expect(getProxyForUrl('http://2130706433/', { env })).toBe('');
  });

  test('bypasses all hosts when NO_PROXY is "*"', () => {
    const env = {
      NO_PROXY: '*',
      HTTP_PROXY: 'http://proxy.internal:8080',
    };

    expect(getProxyForUrl('http://example.com/', { env })).toBe('');
    expect(shouldBypassProxy('http://example.com/', { env })).toBe(true);
  });

  test('uses HTTPS proxy env var for https URLs', () => {
    const env = {
      NO_PROXY: '',
      HTTPS_PROXY: 'https://secure-proxy.internal:8443',
    };

    expect(getProxyForUrl('https://example.com/', { env })).toBe(
      'https://secure-proxy.internal:8443'
    );
  });
});
