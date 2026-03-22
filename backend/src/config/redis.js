const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

const connectRedis = async () => {
  if (!redisClient.isOpen) await redisClient.connect();
};

const cache = {
  get: async (key) => {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },
  set: async (key, value, ttlSeconds = 300) => {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  },
  del: async (key) => redisClient.del(key),
  exists: async (key) => redisClient.exists(key),
};

module.exports = { redisClient, connectRedis, cache };
