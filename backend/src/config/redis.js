const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) return false;
      return Math.min(retries * 300, 3000);
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => console.warn('⚠️  Redis:', err.message));
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

const connectRedis = async () => {
  if (!redisClient.isOpen) await redisClient.connect();
};

// All cache methods are no-ops when Redis is disconnected
const cache = {
  get: async (key) => {
    if (!redisClient.isReady) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  set: async (key, value, ttlSeconds = 300) => {
    if (!redisClient.isReady) return;
    try { await redisClient.setEx(key, ttlSeconds, JSON.stringify(value)); } catch { /* no-op */ }
  },
  del: async (key) => {
    if (!redisClient.isReady) return;
    try { await redisClient.del(key); } catch { /* no-op */ }
  },
  exists: async (key) => {
    if (!redisClient.isReady) return 0;
    try { return await redisClient.exists(key); } catch { return 0; }
  },
};

module.exports = { redisClient, connectRedis, cache };
