import { sanitizeConfig, validateAndNormalizeHeaders } from './sanitize';

describe('sanitizeConfig utility (Prototype Pollution prevention)', () => {
  test('removes simple prototype pollution keys', () => {
    const payload = {
      safeKey: 'safeValue',
      __proto__: { polluted: true },
      constructor: { polluted: true },
      prototype: { polluted: true },
    };

    const result = sanitizeConfig(payload);

    expect(result.safeKey).toBe('safeValue');
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);

    // Verify prototype was not polluted
    expect(({}).polluted).toBeUndefined();
  });

  test('removes keys case-insensitively and handles spaces', () => {
    const payload = {
      safeKey: 'safeValue',
      '__PROTO__': { polluted: true },
      '  __proto__  ': { polluted: true },
      'Constructor': { polluted: true },
      'PROTOTYPE': { polluted: true },
    };

    const result = sanitizeConfig(payload);

    expect(result.safeKey).toBe('safeValue');
    expect(Object.prototype.hasOwnProperty.call(result, '__PROTO__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, '  __proto__  ')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'Constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(result, 'PROTOTYPE')).toBe(false);
  });

  test('recursively sanitizes nested objects', () => {
    const payload = {
      safeKey: {
        nestedSafe: 'nestedVal',
        __proto__: { polluted: true },
        nestedObject: {
          constructor: { polluted: true },
          deepSafe: 'deepVal',
        },
      },
    };

    const result = sanitizeConfig(payload);

    expect(result.safeKey.nestedSafe).toBe('nestedVal');
    expect(Object.prototype.hasOwnProperty.call(result.safeKey, '__proto__')).toBe(false);
    expect(result.safeKey.nestedObject.deepSafe).toBe('deepVal');
    expect(Object.prototype.hasOwnProperty.call(result.safeKey.nestedObject, 'constructor')).toBe(false);
  });

  test('sanitizes objects inside arrays', () => {
    const payload = [
      { id: 1, safe: 'yes' },
      { id: 2, __proto__: { polluted: true }, safe: 'also-yes' },
      { id: 3, nested: [{ constructor: { polluted: true } }] },
    ];

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
