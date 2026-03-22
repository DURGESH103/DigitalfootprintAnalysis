const { Queue } = require('bullmq');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const analysisQueue = new Queue('analysis', { connection });
const resumeQueue = new Queue('resume', { connection });

module.exports = { analysisQueue, resumeQueue, connection };
