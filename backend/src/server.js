require('dotenv').config();
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./sockets');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const analysisRoutes = require('./routes/analysis');
const reportRoutes = require('./routes/reports');
const resumeRoutes = require('./routes/resume');

const app = express();
const server = http.createServer(app);

// Socket.io
initSocket(server);

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handling
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await testConnection();
  await connectRedis();
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};

start().catch(console.error);
