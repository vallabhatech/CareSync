const request = require('supertest');
const express = require('express');

// Mock http-proxy-middleware
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn(() => (req, res) => {
    res.json({ proxied: true, path: req.originalUrl });
  }),
}));

const app = require('../gateway');

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('returns gateway health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.gateway).toBe('CareSync API Gateway');
      expect(res.body.services).toBeInstanceOf(Array);
      expect(res.body.services.length).toBeGreaterThan(0);
    });
  });

  describe('Route proxying', () => {
    it('proxies /api/auth requests to auth service', async () => {
      const res = await request(app).get('/api/auth/login');
      expect(res.status).toBe(200);
      expect(res.body.proxied).toBe(true);
    });

    it('proxies /api/medicines requests to medicine service', async () => {
      const res = await request(app).get('/api/medicines');
      expect(res.status).toBe(200);
      expect(res.body.proxied).toBe(true);
    });

    it('proxies /api/symptom-checks to symptom service', async () => {
      const res = await request(app).get('/api/symptom-checks');
      expect(res.status).toBe(200);
      expect(res.body.proxied).toBe(true);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown non-API routes', async () => {
      const res = await request(app).get('/unknown-path');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Route not found');
    });
  });

  describe('Security headers', () => {
    it('includes helmet security headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('does not expose x-powered-by', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS', () => {
    it('allows requests from configured origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });
});
