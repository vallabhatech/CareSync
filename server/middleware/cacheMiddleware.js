// MVP for Issue 168: Redis Caching Layer
// Currently implemented as an in-memory cache to ensure tests pass without needing a local Redis server.
// Swap `cache` with a real Redis client (e.g., using 'redis' package) for production.

const cache = new Map();

const cacheMiddleware = (durationSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    }

    // Wrap res.json to cache the response before sending
    const originalJson = res.json;
    res.json = (body) => {
      // Store in cache
      cache.set(key, {
        data: body,
        expiry: Date.now() + durationSeconds * 1000
      });
      // Call original json
      return originalJson.call(res, body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
