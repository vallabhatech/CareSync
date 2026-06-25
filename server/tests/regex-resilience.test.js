const { isValidEmail } = require('../utils/validation');

describe('Regex resilience and ReDoS protection', () => {
  test('isValidEmail rejects very long inputs quickly', () => {
    const evil = 'a'.repeat(200000) + '@example.com';
    const start = Date.now();
    const ok = isValidEmail(evil);
    const elapsed = Date.now() - start;
    expect(ok).toBe(false);
    expect(elapsed).toBeLessThan(200); // should be fast
  });
});
