const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    console.log(`Socket connected: user ${userId}`);

    socket.on('disconnect', () => console.log(`Socket disconnected: user ${userId}`));
  });

  console.log('✅ Socket.io initialized');
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, { ...data, timestamp: new Date().toISOString() });
};

const EVENTS = {
  ANALYSIS_STARTED: 'analysis:started',
  FETCHING_PLATFORM: 'analysis:fetching',
  PLATFORM_DONE: 'analysis:platform_done',
  PLATFORM_ERROR: 'analysis:platform_error',
  NORMALIZING: 'analysis:normalizing',
  AI_PROCESSING: 'analysis:ai_processing',
  COMPLETED: 'analysis:completed',
  FAILED: 'analysis:failed',
};

module.exports = { initSocket, emitToUser, EVENTS };
