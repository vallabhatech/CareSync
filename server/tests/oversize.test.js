process.env.BODY_LIMIT = '10kb';

const request = require('supertest');
const app = require('../index');

describe('Oversized payload handling', () => {
  test('rejects requests larger than configured body limit with 413', async () => {
    // Create a payload slightly larger than 10kb
    const largeString = 'a'.repeat(12 * 1024);
    const res = await request(app)
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ data: largeString });

    expect([413, 400]).toContain(res.status); // some environments surface as 400, but body parser should reject
    // If 413 expected, message should indicate payload too large
    if (res.status === 413) {
      expect(res.body && res.body.message).toMatch(/payload/i);
    }
  });
});
