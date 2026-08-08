const request = require('supertest');
const app = require('../index');

describe('Security Controls', () => {
  describe('Header Injection Validation', () => {
    it('should sanitize CRLF characters from query parameters reflected in headers', async () => {
      // The health check endpoint (/) reflects the `injection` query param in the `X-Injection-Response` header.
      const payload = 'payload\r\nInjected-Header: true';
      const encodedPayload = encodeURIComponent(payload);

      const res = await request(app)
        .get(`/?injection=${encodedPayload}`)
        .expect(200);

      // Verify the 'X-Injection-Response' header is present and stripped of CRLF
      expect(res.headers['x-injection-response']).toBe('payloadInjected-Header: true');
      
      // Verify no new header was injected
      expect(res.headers['injected-header']).toBeUndefined();
    });
  });

  describe('Query Parameter Sanitization', () => {
    it('should process requests with prototype pollution payloads without crashing', async () => {
      const res = await request(app)
        .get('/?__proto__[admin]=true')
        .expect(200);

      // Verify the server responds correctly and the sanitization middleware handles it
      expect(res.text).toContain('CareSync API is running...');
    });
  });
});
