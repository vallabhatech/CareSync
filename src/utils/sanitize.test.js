import { sanitizeConfig } from './sanitize';

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
