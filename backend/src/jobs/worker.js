require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { connectRedis, cache } = require('../config/redis');
const { testConnection } = require('../config/database');
const { publishSocketEvent } = require('../config/socketBridge');

const ConnectedAccount = require('../models/ConnectedAccount');
const { PlatformData, NormalizedData } = require('../models/PlatformData');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { fetchGitHubData } = require('../services/fetchers/github');
const { fetchLeetCodeData } = require('../services/fetchers/leetcode');
const { fetchCodeforcesData } = require('../services/fetchers/codeforces');
const { fetchCodeChefData, fetchHackerRankData, fetchLinkedInData, fetchTwitterData } = require('../services/fetchers/social');
const { fetchStackOverflowData } = require('../services/fetchers/stackoverflow');
const { normalizePlatformData } = require('../services/normalizer');
const { computeScores, compareToBenchmarks } = require('../services/scorer');
const { runAnalysisEngine } = require('../services/analysisEngine');
const { getAIInsights } = require('../services/aiClient');

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

// Emit via Redis pub/sub → HTTP server → Socket.io client
const emit = (userId, event, data) => publishSocketEvent(userId, event, data);

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

const processAnalysis = async (job) => {
  const { userId, platforms } = job.data;
  const runningKey = `analysis:running:${userId}`;

  try {
    emit(userId, EVENTS.ANALYSIS_STARTED, { message: 'Analysis started' });

    // 1. Resolve target accounts
    const accounts = await ConnectedAccount.findByUser(userId);
    const targets = platforms
      ? accounts.filter((a) => platforms.includes(a.platform))
      : accounts;

    if (!targets.length) throw new Error('No connected accounts found');

    // 2. Fetch platform data
    const rawDataMap = {};
    for (const account of targets) {
      const fetcher = FETCHERS[account.platform];
      if (!fetcher) continue;

      emit(userId, EVENTS.FETCHING_PLATFORM, { platform: account.platform });

      try {
        const data = await fetcher(account);
        rawDataMap[account.platform] = data;
        await PlatformData.upsert(userId, account.platform, data);
        emit(userId, EVENTS.PLATFORM_DONE, { platform: account.platform });
      } catch (err) {
        console.error(`[worker] fetch failed ${account.platform}:`, err.message);
        emit(userId, EVENTS.PLATFORM_ERROR, { platform: account.platform, error: err.message });
      }
    }

    if (!Object.keys(rawDataMap).length) throw new Error('Failed to fetch data from any platform');

    // 3. Normalize
    emit(userId, EVENTS.NORMALIZING, { message: 'Normalizing data...' });
    const normalizedList = [];
    for (const [platform, data] of Object.entries(rawDataMap)) {
      try {
        const normalized = normalizePlatformData(platform, data);
        normalizedList.push(normalized);
        await NormalizedData.upsert(userId, platform, normalized);
      } catch (err) {
        console.error(`[worker] normalize failed ${platform}:`, err.message);
      }
    }

    // 4. Score + analyze
    const scores = computeScores(normalizedList);
    const comparison = compareToBenchmarks(scores);
    const analysis = runAnalysisEngine(normalizedList, rawDataMap);

    // 5. AI insights
    emit(userId, EVENTS.AI_PROCESSING, { message: 'Generating AI insights...' });
    let aiInsights;
    try {
      aiInsights = await getAIInsights({ scores, analysis, platforms: Object.keys(rawDataMap) });
    } catch (err) {
      console.error('[worker] AI service failed:', err.message);
      aiInsights = generateFallbackInsights(scores, analysis);
    }

    // 6. Persist report
    const reportId = await Report.create(userId, { ai: aiInsights, analysis, comparison }, scores);

    // 7. Create notification
    await Notification.create(
      userId,
      'analysis_complete',
      'Analysis Complete 🎉',
      `Your digital footprint report is ready. Hireability: ${scores.hireability_score}/100`,
      { reportId }
    ).catch(() => {}); // non-critical

    emit(userId, EVENTS.COMPLETED, { reportId, message: 'Analysis complete!' });
    return { reportId };

  } finally {
    // Always clear the running lock so the user can re-run
    await cache.del(runningKey);
  }
};

const generateFallbackInsights = (scores, analysis) => ({
  persona: `You are a ${(scores.behavior_type || 'developer').toLowerCase()} with ${analysis.patterns?.consistency || 'moderate'} consistency.`,
  strengths: (scores.all_skills || []).slice(0, 3).map((s) => `Strong in ${s}`),
  weaknesses: scores.visibility_score < 40 ? ['Low social visibility'] : ['Could improve consistency'],
  suggestions: [analysis.growth?.recommendation || 'Keep practicing', 'Diversify your platform presence'],
  skill_gaps: [],
  career_path: 'Software Engineer',
  generated_by: 'fallback',
});

const startWorker = async () => {
  await testConnection();
  await connectRedis();

  const worker = new Worker('analysis', processAnalysis, {
    connection,
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`[worker] Job ${job.id} completed`));
  worker.on('failed', async (job, err) => {
    console.error(`[worker] Job ${job.id} failed:`, err.message);
    if (job?.data?.userId) {
      await cache.del(`analysis:running:${job.data.userId}`).catch(() => {});
      await publishSocketEvent(job.data.userId, EVENTS.FAILED, { error: err.message });
      await Notification.create(
        job.data.userId,
        'analysis_failed',
        'Analysis Failed',
        `Analysis could not complete: ${err.message}`,
        null
      ).catch(() => {});
    }
  });

  console.log('🔧 Analysis worker started');
};

startWorker().catch(console.error);
