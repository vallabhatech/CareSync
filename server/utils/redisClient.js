const redis = require('redis');

let redisClient;
let isRedisConnected = false;

(async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  });

  redisClient.on('error', (error) => {
    console.error(`Redis Error: ${error}`);
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
    isRedisConnected = true;
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('Redis failed to connect initially. Falling back to DB queries.');
  }
})();

module.exports = {
  getClient: () => redisClient,
  isConnected: () => isRedisConnected
};
