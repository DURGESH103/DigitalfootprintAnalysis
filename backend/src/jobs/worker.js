require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { connectRedis } = require('../config/redis');
const { testConnection } = require('../config/database');

const ConnectedAccount = require('../models/ConnectedAccount');
const { PlatformData, NormalizedData } = require('../models/PlatformData');
const Report = require('../models/Report');
const { fetchGitHubData } = require('../services/fetchers/github');
const { fetchLeetCodeData } = require('../services/fetchers/leetcode');
const { fetchCodeforcesData } = require('../services/fetchers/codeforces');
const { fetchCodeChefData, fetchHackerRankData, fetchLinkedInData, fetchTwitterData } = require('../services/fetchers/social');
const { normalizePlatformData } = require('../services/normalizer');
const { computeScores, compareToBenchmarks } = require('../services/scorer');
const { runAnalysisEngine } = require('../services/analysisEngine');
const { getAIInsights } = require('../services/aiClient');
const { emitToUser, EVENTS } = require('../sockets');

const FETCHERS = {
  github: (acc) => fetchGitHubData(acc.username, acc.access_token),
  leetcode: (acc) => fetchLeetCodeData(acc.username),
  codeforces: (acc) => fetchCodeforcesData(acc.username),
  codechef: (acc) => fetchCodeChefData(acc.username),
  hackerrank: (acc) => fetchHackerRankData(acc.username),
  linkedin: (acc) => fetchLinkedInData(acc.username),
  twitter: (acc) => fetchTwitterData(acc.username),
};

const processAnalysis = async (job) => {
  const { userId, platforms } = job.data;

  emitToUser(userId, EVENTS.ANALYSIS_STARTED, { message: 'Analysis started' });

  // 1. Get connected accounts
  const accounts = await ConnectedAccount.findByUser(userId);
  const targets = platforms
    ? accounts.filter((a) => platforms.includes(a.platform))
    : accounts;

  if (!targets.length) throw new Error('No connected accounts found');

  // 2. Fetch data from each platform
  const rawDataMap = {};
  for (const account of targets) {
    const fetcher = FETCHERS[account.platform];
    if (!fetcher) continue;

    emitToUser(userId, EVENTS.FETCHING_PLATFORM, { platform: account.platform, message: `Fetching ${account.platform}...` });

    try {
      const data = await fetcher(account);
      rawDataMap[account.platform] = data;
      await PlatformData.upsert(userId, account.platform, data);
      emitToUser(userId, EVENTS.PLATFORM_DONE, { platform: account.platform });
    } catch (err) {
      console.error(`Failed to fetch ${account.platform}:`, err.message);
      emitToUser(userId, EVENTS.PLATFORM_ERROR, { platform: account.platform, error: err.message });
    }
  }

  if (!Object.keys(rawDataMap).length) throw new Error('Failed to fetch data from any platform');

  // 3. Normalize
  emitToUser(userId, EVENTS.NORMALIZING, { message: 'Normalizing data...' });
  const normalizedList = [];
  for (const [platform, data] of Object.entries(rawDataMap)) {
    try {
      const normalized = normalizePlatformData(platform, data);
      normalizedList.push(normalized);
      await NormalizedData.upsert(userId, platform, normalized);
    } catch (err) {
      console.error(`Normalization failed for ${platform}:`, err.message);
    }
  }

  // 4. Compute scores
  const scores = computeScores(normalizedList);
  const comparison = compareToBenchmarks(scores);
  const analysis = runAnalysisEngine(normalizedList, rawDataMap);

  // 5. AI Insights
  emitToUser(userId, EVENTS.AI_PROCESSING, { message: 'Generating AI insights...' });
  let aiInsights = null;
  try {
    aiInsights = await getAIInsights({ scores, analysis, platforms: Object.keys(rawDataMap) });
  } catch (err) {
    console.error('AI service failed:', err.message);
    aiInsights = generateFallbackInsights(scores, analysis);
  }

  // 6. Save report
  const insights = { ai: aiInsights, analysis, comparison };
  const reportId = await Report.create(userId, insights, scores);

  emitToUser(userId, EVENTS.COMPLETED, { reportId, message: 'Analysis complete!' });
  return { reportId };
};

const generateFallbackInsights = (scores, analysis) => {
  const { behavior_type, all_skills } = scores;
  const { patterns, growth } = analysis;

  return {
    persona: `You are a ${behavior_type.toLowerCase()} with ${patterns.consistency} consistency and ${growth.growth_velocity} growth velocity.`,
    strengths: all_skills.slice(0, 3).map((s) => `Strong in ${s}`),
    weaknesses: scores.visibility_score < 40 ? ['Low social visibility'] : ['Could improve consistency'],
    suggestions: [growth.recommendation, 'Diversify your platform presence'],
    generated_by: 'fallback',
  };
};

const startWorker = async () => {
  await testConnection();
  await connectRedis();

  const worker = new Worker('analysis', processAnalysis, {
    connection,
    concurrency: 3,
  });

  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err.message));

  console.log('🔧 Analysis worker started');
};

startWorker().catch(console.error);
