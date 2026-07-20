import { sanitizeConfig, validateAndNormalizeHeaders, validateUrl } from './sanitize';


describe('sanitizeConfig utility (Prototype Pollution prevention)', () => {
  test('removes simple prototype pollution keys', () => {
    const payload = JSON.parse(`{
      "safeKey": "safeValue",
      "__proto__": { "polluted": true },
      "constructor": { "polluted": true },
      "prototype": { "polluted": true }
    }`);

    const result = sanitizeConfig(payload);

    expect(result.safeKey).toBe('safeValue');
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);

    // Verify prototype was not polluted
    expect(({}).polluted).toBeUndefined();
  });

  test('removes keys case-insensitively and handles spaces', () => {
    const payload = JSON.parse(`{
      "safeKey": "safeValue",
      "__PROTO__": { "polluted": true },
      "  __proto__  ": { "polluted": true },
      "Constructor": { "polluted": true },
      "PROTOTYPE": { "polluted": true }
    }`);

    const result = sanitizeConfig(payload);

    expect(result.safeKey).toBe('safeValue');
    expect(Object.prototype.hasOwnProperty.call(result, '__PROTO__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, '  __proto__  ')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'Constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'PROTOTYPE')).toBe(false);
  });

  test('recursively sanitizes nested objects', () => {
    const payload = JSON.parse(`{
      "safeKey": {
        "nestedSafe": "nestedVal",
        "__proto__": { "polluted": true },
        "nestedObject": {
          "constructor": { "polluted": true },
          "deepSafe": "deepVal"
        }
      }
    }`);

    const result = sanitizeConfig(payload);

    expect(result.safeKey.nestedSafe).toBe('nestedVal');
    expect(Object.prototype.hasOwnProperty.call(result.safeKey, '__proto__')).toBe(false);
    expect(result.safeKey.nestedObject.deepSafe).toBe('deepVal');
    expect(Object.prototype.hasOwnProperty.call(result.safeKey.nestedObject, 'constructor')).toBe(false);
  });

  test('sanitizes objects inside arrays', () => {
    const payload = JSON.parse(`[
      { "id": 1, "safe": "yes" },
      { "id": 2, "__proto__": { "polluted": true }, "safe": "also-yes" },
      { "id": 3, "nested": [{ "constructor": { "polluted": true } }] }
    ]`);

    const result = sanitizeConfig(payload);

    expect(result[0].safe).toBe('yes');
    expect(result[1].safe).toBe('also-yes');
    expect(Object.prototype.hasOwnProperty.call(result[1], '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result[2].nested[0], 'constructor')).toBe(false);
  });

  test('handles primitives, null, and undefined correctly', () => {
    expect(sanitizeConfig(null)).toBeNull();
    expect(sanitizeConfig(undefined)).toBeUndefined();
    expect(sanitizeConfig('string')).toBe('string');
    expect(sanitizeConfig(123)).toBe(123);
    expect(sanitizeConfig(true)).toBe(true);
  });
});

describe('validateAndNormalizeHeaders utility (Header Injection prevention)', () => {
  test('rejects CRLF characters in header values', () => {
    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': 'value\r\ninjected: true' });
    }).toThrow(/CRLF injection detected/);

    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': 'value\nInjected-Header: value' });
    }).toThrow(/CRLF injection detected/);

    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': 'value\rInjected-Header: value' });
    }).toThrow(/CRLF injection detected/);
  });

  test('rejects CRLF characters in array header values', () => {
    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': ['value1', 'value2\r\ninjected: true'] });
    }).toThrow(/CRLF injection detected/);
  });

  test('rejects ASCII control characters in header values', () => {
    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': 'value\x00injected' });
    }).toThrow(/Control characters detected/);

    expect(() => {
      validateAndNormalizeHeaders({ 'X-Test-Header': 'value\x1finjected' });
    }).toThrow(/Control characters detected/);
  });

  test('rejects malformed header names', () => {
    expect(() => {
      validateAndNormalizeHeaders({ 'Malformed Name': 'value' }); // contains space
    }).toThrow(/Malformed header name/);

    expect(() => {
      validateAndNormalizeHeaders({ 'Malformed:Name': 'value' }); // contains colon
    }).toThrow(/Malformed header name/);

    expect(() => {
      validateAndNormalizeHeaders({ 'Malformed@Name': 'value' }); // contains invalid token char
    }).toThrow(/Malformed header name/);
  });

  test('rejects prototype pollution derived headers', () => {
    expect(() => {
      validateAndNormalizeHeaders(JSON.parse('{"__proto__": "value"}'));
    }).toThrow(/blocked prototype key/);

    expect(() => {
      validateAndNormalizeHeaders({ 'constructor': 'value' });
    }).toThrow(/blocked prototype key/);

    expect(() => {
      validateAndNormalizeHeaders({ 'prototype': 'value' });
    }).toThrow(/blocked prototype key/);
  });

  test('normalizes header values', () => {
    const input = {
      'X-Test-Number': 123,
      'X-Test-Boolean': true,
      'X-Test-String': '  trimmed-value  ',
      'X-Test-Array': ['  val1  ', 456],
    };

    const result = validateAndNormalizeHeaders(input);

    expect(result['X-Test-Number']).toBe('123');
    expect(result['X-Test-Boolean']).toBe('true');
    expect(result['X-Test-String']).toBe('trimmed-value');
    expect(result['X-Test-Array']).toEqual(['val1', '456']);
  });

  test('handles null, undefined, empty, and safe inputs', () => {
    const input = {
      'X-Test-Null': null,
      'X-Test-Undefined': undefined,
      'X-Test-Empty': '',
    };

    const result = validateAndNormalizeHeaders(input);

    expect(result['X-Test-Null']).toBe('');
    expect(result['X-Test-Undefined']).toBe('');
    expect(result['X-Test-Empty']).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateUrl – SSRF prevention tests
// ─────────────────────────────────────────────────────────────────────────────
describe('validateUrl utility (SSRF prevention)', () => {

  // ── Allowed / positive cases ──────────────────────────────────────────────
  describe('allows legitimate public URLs', () => {
    test('allows https public domain', () => {
      expect(() => validateUrl('https://example.com/api/data')).not.toThrow();
    });

    test('allows http public domain', () => {
      expect(() => validateUrl('http://example.com/path?q=1')).not.toThrow();
    });

    test('allows nominatim (used in ClinicsNearby)', () => {
      expect(() =>
        validateUrl(
          'https://nominatim.openstreetmap.org/search?format=json&q=London'
        )
      ).not.toThrow();
    });

    test('returns a parsed URL object on success', () => {
      const result = validateUrl('https://api.caresync.example.com/v1/records');
      expect(result).toBeInstanceOf(URL);
      expect(result.hostname).toBe('api.caresync.example.com');
    });
  });

  // ── Protocol abuse ────────────────────────────────────────────────────────
  describe('blocks forbidden protocols', () => {
    const forbiddenProtocols = [
      'file:///etc/passwd',
      'ftp://attacker.com/payload',
      'gopher://attacker.com/_GET /',
      'javascript:alert(1)',
      'data:text/html,<h1>XSS</h1>',
      'dict://127.0.0.1:11211/stat',
      'sftp://internal.host/secret',
      'ldap://127.0.0.1/dc=example',
    ];

    forbiddenProtocols.forEach((url) => {
      test(`blocks "${url.slice(0, 50)}"`, () => {
        expect(() => validateUrl(url)).toThrow(/Protocol .* is not allowed/);
      });
    });
  });

  // ── localhost / loopback hostname ─────────────────────────────────────────
  describe('blocks localhost aliases', () => {
    test('blocks localhost', () => {
      expect(() => validateUrl('http://localhost/admin')).toThrow(
        /loopback alias/
      );
    });

    test('blocks ip6-localhost', () => {
      expect(() => validateUrl('http://ip6-localhost/')).toThrow(
        /loopback alias/
      );
    });
  });

  // ── IPv4 loopback (127.x.x.x) ─────────────────────────────────────────────
  describe('blocks 127.0.0.0/8 loopback', () => {
    test('blocks 127.0.0.1', () => {
      expect(() => validateUrl('http://127.0.0.1/')).toThrow(/blocked/);
    });

    test('blocks 127.1.2.3', () => {
      expect(() => validateUrl('http://127.1.2.3/')).toThrow(/blocked/);
    });

    test('blocks 127.255.255.255', () => {
      expect(() => validateUrl('http://127.255.255.255/')).toThrow(/blocked/);
    });
  });

  // ── 0.0.0.0 ───────────────────────────────────────────────────────────────
  describe('blocks 0.0.0.0/8', () => {
    test('blocks 0.0.0.0', () => {
      expect(() => validateUrl('http://0.0.0.0/')).toThrow(/blocked/);
    });

    test('blocks 0.1.2.3', () => {
      expect(() => validateUrl('http://0.1.2.3/')).toThrow(/blocked/);
    });
  });

  // ── RFC-1918 private ranges ───────────────────────────────────────────────
  describe('blocks RFC-1918 private IP ranges', () => {
    test('blocks 10.0.0.1', () => {
      expect(() => validateUrl('http://10.0.0.1/')).toThrow(/blocked/);
    });

    test('blocks 10.255.255.255', () => {
      expect(() => validateUrl('http://10.255.255.255/')).toThrow(/blocked/);
    });

    test('blocks 172.16.0.1', () => {
      expect(() => validateUrl('http://172.16.0.1/')).toThrow(/blocked/);
    });

    test('blocks 172.31.255.255', () => {
      expect(() => validateUrl('http://172.31.255.255/')).toThrow(/blocked/);
    });

    test('allows 172.15.255.255 (just outside private range)', () => {
      // 172.15.x.x is NOT in 172.16/12 — it is a legitimate public address
      expect(() => validateUrl('http://172.15.255.255/')).not.toThrow();
    });

    test('allows 172.32.0.0 (just above private range)', () => {
      expect(() => validateUrl('http://172.32.0.0/')).not.toThrow();
    });

    test('blocks 192.168.0.1', () => {
      expect(() => validateUrl('http://192.168.0.1/')).toThrow(/blocked/);
    });

    test('blocks 192.168.255.255', () => {
      expect(() => validateUrl('http://192.168.255.255/')).toThrow(/blocked/);
    });
  });

  // ── Link-local / APIPA ────────────────────────────────────────────────────
  describe('blocks 169.254.0.0/16 link-local', () => {
    test('blocks 169.254.0.1', () => {
      expect(() => validateUrl('http://169.254.0.1/')).toThrow(/blocked/);
    });

    test('blocks 169.254.169.254 (AWS IMDS)', () => {
      expect(() => validateUrl('http://169.254.169.254/')).toThrow(
        /metadata endpoint|blocked/
      );
    });
  });

  // ── Cloud metadata endpoints (hostname blocklist) ─────────────────────────
  describe('blocks cloud metadata hostnames', () => {
    test('blocks 169.254.169.254 IP metadata', () => {
      expect(() =>
        validateUrl('http://169.254.169.254/latest/meta-data/iam/security-credentials/')
      ).toThrow(/metadata endpoint|blocked/);
    });

    test('blocks 100.100.100.200 (Alibaba Cloud)', () => {
      expect(() =>
        validateUrl('http://100.100.100.200/latest/meta-data/')
      ).toThrow(/metadata endpoint|blocked/);
    });

    test('blocks metadata.google.internal', () => {
      expect(() =>
        validateUrl('http://metadata.google.internal/computeMetadata/v1/')
      ).toThrow(/metadata endpoint/);
    });

    test('blocks metadata.goog', () => {
      expect(() => validateUrl('http://metadata.goog/')).toThrow(
        /metadata endpoint/
      );
    });
  });

  // ── SSRF bypass attempts: encoded / alternate IP representations ──────────
  describe('blocks SSRF bypass attempts', () => {
    test('blocks hexadecimal IP 0x7f000001 (127.0.0.1)', () => {
      // Browsers/URL parser normalise this to 127.0.0.1
      expect(() => validateUrl('http://0x7f000001/')).toThrow(/blocked/);
    });

    test('blocks octal IP 0177.0.0.1 (127.0.0.1)', () => {
      expect(() => validateUrl('http://0177.0.0.1/')).toThrow(/blocked/);
    });

    test('blocks decimal IP 2130706433 (127.0.0.1)', () => {
      expect(() => validateUrl('http://2130706433/')).toThrow(/blocked/);
    });

    test('blocks short-form 127.1 (classful expands to 127.0.0.1)', () => {
      expect(() => validateUrl('http://127.1/')).toThrow(/blocked/);
    });

    test('blocks trailing-dot bypass attempt for localhost', () => {
      expect(() => validateUrl('http://localhost./')).toThrow(/loopback alias/);
    });

    test('blocks trailing-dot bypass for metadata service', () => {
      expect(() => validateUrl('http://metadata.google.internal./')).toThrow(/metadata endpoint/);
    });
  });

  // ── IPv6 loopback & link-local ────────────────────────────────────────────
  describe('blocks IPv6 loopback and link-local addresses', () => {
    test('blocks ::1 (IPv6 loopback)', () => {
      expect(() => validateUrl('http://[::1]/')).toThrow(/blocked/);
    });

    test('blocks ::ffff:127.0.0.1 (IPv4-mapped loopback)', () => {
      expect(() => validateUrl('http://[::ffff:127.0.0.1]/')).toThrow(
        /blocked/
      );
    });

    test('blocks ::ffff:192.168.1.1 (IPv4-mapped private)', () => {
      expect(() => validateUrl('http://[::ffff:192.168.1.1]/')).toThrow(
        /blocked/
      );
    });

    test('blocks fe80::1 (IPv6 link-local)', () => {
      expect(() => validateUrl('http://[fe80::1]/')).toThrow(/blocked/);
    });

    test('blocks fc00::1 (unique local)', () => {
      expect(() => validateUrl('http://[fc00::1]/')).toThrow(/blocked/);
    });

    test('blocks fd12:3456:789a::1 (unique local fd::/8)', () => {
      expect(() => validateUrl('http://[fd12:3456:789a::1]/')).toThrow(
        /blocked/
      );
    });
  });

  // ── Input validation ──────────────────────────────────────────────────────
  describe('rejects invalid / empty inputs', () => {
    test('throws on null', () => {
      expect(() => validateUrl(null)).toThrow(/non-empty string/);
    });

    test('throws on undefined', () => {
      expect(() => validateUrl(undefined)).toThrow(/non-empty string/);
    });

    test('throws on empty string', () => {
      expect(() => validateUrl('')).toThrow(/non-empty string/);
    });

    test('throws on non-string number', () => {
      expect(() => validateUrl(12345)).toThrow(/non-empty string/);
    });

    test('throws on malformed URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow(/Malformed URL/);
    });
  });
});
