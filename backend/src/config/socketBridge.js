/**
 * Redis Pub/Sub bridge for cross-process Socket.io events.
 *
 * Worker process  → publishes to Redis channel "socket:emit"
 * HTTP server     → subscribes and forwards to Socket.io rooms
 *
 * Gracefully degrades: if Redis is unavailable the server still starts,
 * real-time events just won't fire (polling fallback handles it).
 */

const { createClient } = require('redis');

const CHANNEL = 'socket:emit';

const makeRedisClient = () =>
  createClient({
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries) => {
        if (retries > 5) return false; // stop retrying after 5 attempts
        return Math.min(retries * 500, 3000);
      },
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

// ─── Publisher (worker process) ───────────────────────────────────────────────
let publisher = null;
let publisherReady = false;

const getPublisher = async () => {
  if (publisherReady && publisher?.isOpen) return publisher;

  publisher = makeRedisClient();
  publisher.on('error', (e) => {
    // Only log once, not on every retry
    if (publisherReady) console.warn('[Redis publisher] connection lost:', e.message);
  });

  try {
    await publisher.connect();
    publisherReady = true;
  } catch (e) {
    publisherReady = false;
    throw e;
  }
  return publisher;
};

const publishSocketEvent = async (userId, event, data) => {
  try {
    const pub = await getPublisher();
    await pub.publish(CHANNEL, JSON.stringify({ userId, event, data }));
  } catch (e) {
    // Non-fatal: real-time event lost, polling fallback will catch it
    console.warn('[Redis publisher] could not publish event:', e.message);
  }
};

// ─── Subscriber (HTTP server process) ────────────────────────────────────────
const startSocketBridge = async (io) => {
  const subscriber = makeRedisClient();

  subscriber.on('error', (e) =>
    console.warn('[Redis subscriber] error (real-time events paused):', e.message)
  );

  try {
    await subscriber.connect();

    await subscriber.subscribe(CHANNEL, (message) => {
      try {
        const { userId, event, data } = JSON.parse(message);
        io.to(`user:${userId}`).emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('[Socket bridge] parse error:', e.message);
      }
    });

    console.log('✅ Redis→Socket bridge active');
  } catch (e) {
    // Non-fatal: server runs without real-time push; clients fall back to polling
    console.warn('⚠️  Redis→Socket bridge unavailable (polling fallback active):', e.message);
  }
};

module.exports = { publishSocketEvent, startSocketBridge };
