const { analysisQueue } = require('../config/queue');
const { cache } = require('../config/redis');
const ConnectedAccount = require('../models/ConnectedAccount');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// In-memory fallback when Redis is unavailable
const runningJobs = new Map();

const isRunning = async (userId) => {
  try {
    const val = await cache.get(`analysis:running:${userId}`);
    return !!val;
  } catch {
    return runningJobs.has(userId);
  }
};

const setRunning = async (userId) => {
  try {
    await cache.set(`analysis:running:${userId}`, true, 300);
  } catch {
    runningJobs.set(userId, true);
    setTimeout(() => runningJobs.delete(userId), 300000);
  }
};

const clearRunning = async (userId) => {
  try {
    await cache.del(`analysis:running:${userId}`);
  } catch {
    runningJobs.delete(userId);
  }
};

const triggerAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { platforms } = req.body;

  const accounts = await ConnectedAccount.findByUser(userId);
  if (!accounts.length)
    return error(res, 'No connected accounts. Please connect at least one platform.', 400);

  if (await isRunning(userId))
    return error(res, 'Analysis already in progress', 409);

  await setRunning(userId);

  const job = await analysisQueue.add(
    'analyze-user',
    { userId, platforms: platforms || null },
    { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 50, removeOnFail: 20 }
  );

  return success(res, {
    jobId: job.id,
    message: 'Analysis started. Connect via WebSocket for real-time updates.',
  }, 'Analysis queued');
});

const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await analysisQueue.getJob(jobId);
  if (!job) return error(res, 'Job not found', 404);

  const state = await job.getState();
  return success(res, { jobId, state, progress: job.progress, result: job.returnvalue });
});

module.exports = { triggerAnalysis, getJobStatus, clearRunning };
