const { analysisQueue } = require('../config/queue');
const ConnectedAccount = require('../models/ConnectedAccount');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// In-memory lock (works without Redis)
const runningJobs = new Map();

const isRunning = (userId) => runningJobs.has(userId);
const setRunning = (userId) => {
  runningJobs.set(userId, true);
  // Auto-expire after 10 minutes as safety net
  setTimeout(() => runningJobs.delete(userId), 600000);
};
const clearRunning = (userId) => runningJobs.delete(userId);

// Run the full pipeline in-process (used when Redis/BullMQ unavailable)
const runInProcess = async (userId, platforms) => {
  const { PlatformData, NormalizedData } = require('../models/PlatformData');
  const Report = require('../models/Report');
  const { fetchGitHubData } = require('../services/fetchers/github');
  const { fetchLeetCodeData } = require('../services/fetchers/leetcode');
  const { fetchCodeforcesData } = require('../services/fetchers/codeforces');
  const { fetchCodeChefData, fetchHackerRankData, fetchLinkedInData, fetchTwitterData } = require('../services/fetchers/social');
  const { fetchStackOverflowData } = require('../services/fetchers/stackoverflow');
  const { normalizePlatformData } = require('../services/normalizer');
  const { computeScores, compareToBenchmarks } = require('../services/scorer');
  const { runAnalysisEngine } = require('../services/analysisEngine');
  const { getAIInsights } = require('../services/aiClient');

  const FETCHERS = {
    github: (acc) => fetchGitHubData(acc.username, acc.access_token),
    leetcode: (acc) => fetchLeetCodeData(acc.username),
    codeforces: (acc) => fetchCodeforcesData(acc.username),
    codechef: (acc) => fetchCodeChefData(acc.username),
    hackerrank: (acc) => fetchHackerRankData(acc.username),
    linkedin: (acc) => fetchLinkedInData(acc.username),
    twitter: (acc) => fetchTwitterData(acc.username),
    stackoverflow: (acc) => fetchStackOverflowData(acc.username),
  };

  const accounts = await ConnectedAccount.findByUser(userId);
  const targets = platforms ? accounts.filter((a) => platforms.includes(a.platform)) : accounts;

  // Fetch
  const rawDataMap = {};
  for (const acc of targets) {
    const fetcher = FETCHERS[acc.platform];
    if (!fetcher) continue;
    try {
      rawDataMap[acc.platform] = await fetcher(acc);
      await PlatformData.upsert(userId, acc.platform, rawDataMap[acc.platform]);
    } catch (e) {
      console.error(`[in-process] fetch failed ${acc.platform}:`, e.message);
    }
  }

  if (!Object.keys(rawDataMap).length) throw new Error('Failed to fetch data from any platform');

  // Normalize
  const normalizedList = [];
  for (const [platform, data] of Object.entries(rawDataMap)) {
    try {
      const normalized = normalizePlatformData(platform, data);
      normalizedList.push(normalized);
      await NormalizedData.upsert(userId, platform, normalized);
    } catch (e) {
      console.error(`[in-process] normalize failed ${platform}:`, e.message);
    }
  }

  // Score
  const scores = computeScores(normalizedList);
  const comparison = compareToBenchmarks(scores);
  const analysis = runAnalysisEngine(normalizedList, rawDataMap);

  // AI insights
  let aiInsights;
  try {
    aiInsights = await getAIInsights({ scores, analysis, platforms: Object.keys(rawDataMap) });
  } catch {
    aiInsights = {
      persona: `You are a ${(scores.behavior_type || 'developer').toLowerCase()} with ${analysis.patterns?.consistency || 'moderate'} consistency.`,
      strengths: (scores.all_skills || []).slice(0, 3).map((s) => `Strong in ${s}`),
      weaknesses: scores.visibility_score < 40 ? ['Low social visibility'] : ['Could improve consistency'],
      suggestions: [analysis.growth?.recommendation || 'Keep practicing', 'Diversify your platform presence'],
      skill_gaps: [],
      career_path: 'Software Engineer',
      generated_by: 'fallback',
    };
  }

  const reportId = await Report.create(userId, { ai: aiInsights, analysis, comparison }, scores);
  return reportId;
};

const triggerAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { platforms } = req.body;

  const accounts = await ConnectedAccount.findByUser(userId);
  if (!accounts.length)
    return error(res, 'No connected accounts. Please connect at least one platform.', 400);

  if (isRunning(userId))
    return error(res, 'Analysis already in progress', 409);

  setRunning(userId);

  // Try BullMQ queue first; fall back to in-process if Redis unavailable
  try {
    const job = await analysisQueue.add(
      'analyze-user',
      { userId, platforms: platforms || null },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 50, removeOnFail: 20 }
    );
    return success(res, { jobId: job.id, mode: 'queued', message: 'Analysis queued.' }, 'Analysis queued');
  } catch (queueErr) {
    console.warn('[analysis] BullMQ unavailable, running in-process:', queueErr.message);
    // Run synchronously — respond immediately with a pseudo jobId, process in background
    const jobId = `local-${userId}-${Date.now()}`;
    setImmediate(async () => {
      try {
        const reportId = await runInProcess(userId, platforms || null);
        console.log(`[in-process] analysis complete for user ${userId}, report ${reportId}`);
      } catch (e) {
        console.error(`[in-process] analysis failed for user ${userId}:`, e.message);
      } finally {
        clearRunning(userId);
      }
    });
    return success(res, { jobId, mode: 'in-process', message: 'Analysis running. Refresh in ~30 seconds.' }, 'Analysis started');
  }
});

const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  // In-process jobs don't have BullMQ entries
  if (jobId.startsWith('local-')) {
    const userId = parseInt(jobId.split('-')[1], 10);
    const running = isRunning(userId);
    return success(res, { jobId, state: running ? 'active' : 'completed', progress: running ? 50 : 100 });
  }

  const job = await analysisQueue.getJob(jobId).catch(() => null);
  if (!job) return error(res, 'Job not found', 404);

  const state = await job.getState();
  return success(res, { jobId, state, progress: job.progress, result: job.returnvalue });
});

const clearLock = asyncHandler(async (req, res) => {
  clearRunning(req.user.id);
  return success(res, {}, 'Lock cleared');
});

module.exports = { triggerAnalysis, getJobStatus, clearRunning, clearLock };
