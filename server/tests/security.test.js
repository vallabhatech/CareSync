process.env.NODE_ENV = 'test';

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => (req, res, next) => next()),
  fixRequestBody: jest.fn()
}));

const request = require('supertest');
const app = require('../index');
const { isValidEmail } = require('../utils/validation');

describe('Security test suite', () => {
  test('Prototype pollution is blocked by request sanitizer', async () => {
    const payload = { __proto__: { hacked: true }, safe: 'ok' };
    const res = await request(app).post('/__test/sanitize').send(payload).set('Accept', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('safe', 'ok');
    // Verify __proto__ is not an own property of res.body
    expect(Object.prototype.hasOwnProperty.call(res.body, '__proto__')).toBe(false);
    // Ensure we didn't pollute Object.prototype
    expect(Object.prototype).not.toHaveProperty('hacked');
  });

  test('Header injection sanitized when echoed into response header', async () => {
    const malicious = 'value\r\nX-Injected: injected';
    const res = await request(app).get(`/?injection=${encodeURIComponent(malicious)}`);
    expect(res.status).toBe(200);
    // Response header must not contain raw CRLF sequences
    const header = res.header['x-injection-response'];
    expect(header).toBeDefined();
    expect(/\r|\n/.test(header)).toBe(false);
  });

  test('Oversized payloads are rejected with 413', async () => {
    const big = 'a'.repeat(6 * 1024 * 1024);
    const res = await request(app)
      .post('/__test/sanitize')
      .set('Content-Type', 'application/json')
      .send({ data: big });

    // Express body-parser should enforce limit and return 413 or 400 depending on environment
    expect([413, 400]).toContain(res.status);
  }, 20000);

  test('sanitizeBody strips YAML-merge-style __proto__ injection without polluting prototype', async () => {
    // Simulate what js-yaml's << merge operator can produce in versions < 4.x:
    // a request body where __proto__ arrives as a string key (own property)
    // via JSON-serialised YAML output. The sanitizer must drop the key AND
    // must not itself pollute Object.prototype during the sanitize pass.
    const payload = JSON.parse('{"__proto__":{"isAdmin":true},"role":"user"}');
    const res = await request(app)
      .post('/__test/sanitize')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('user');
    expect(Object.prototype.hasOwnProperty.call(res.body, '__proto__')).toBe(false);
    // Verify the sanitize pass itself did not pollute Object.prototype.
    expect(Object.prototype).not.toHaveProperty('isAdmin');
  });

  test('sanitizeBody strips nested YAML-merge-style constructor/prototype keys', async () => {
    const payload = JSON.parse(
      '{"user":{"constructor":{"polluted":true},"name":"alice"},"prototype":{"evil":1}}'
    );
    const res = await request(app)
      .post('/__test/sanitize')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('alice');
    expect(Object.prototype.hasOwnProperty.call(res.body.user, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'prototype')).toBe(false);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  test('isValidEmail is resilient to ReDoS attempts', () => {
    const evil = 'a'.repeat(200000) + '@example.com';
    const start = Date.now();
    const ok = isValidEmail(evil);
    const elapsed = Date.now() - start;
    expect(ok).toBe(false);
    expect(elapsed).toBeLessThan(200);
  });
});
