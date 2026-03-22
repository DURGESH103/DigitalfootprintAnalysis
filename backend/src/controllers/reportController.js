const Report = require('../models/Report');
const { getWeeklyTrends, getMonthlyGrowth, getPlatformTrends } = require('../services/analytics');
const { computeScores, compareToBenchmarks } = require('../services/scorer');
const { NormalizedData } = require('../models/PlatformData');
const { success, error, paginated } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getLatestReport = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user.id;

  const report = await Report.findLatestByUser(userId);
  if (!report) return error(res, 'No report found. Run analysis first.', 404);

  return success(res, report);
});

const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId, req.user.id);
  if (!report) return error(res, 'Report not found', 404);
  return success(res, report);
});

const listReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { rows, total } = await Report.findAllByUser(
    req.user.id,
    parseInt(page, 10),
    parseInt(limit, 10)
  );
  return paginated(res, rows, total, page, limit);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [weekly, monthly, platformTrends] = await Promise.all([
    getWeeklyTrends(userId),
    getMonthlyGrowth(userId),
    getPlatformTrends(userId),
  ]);

  return success(res, {
    weekly_trends: weekly,
    monthly_growth: monthly,
    platform_trends: platformTrends,
  });
});

const getComparison = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const normalizedList = await NormalizedData.findByUser(userId);
  if (!normalizedList.length) return error(res, 'No data available. Run analysis first.', 404);

  const scores = computeScores(normalizedList);
  const comparison = compareToBenchmarks(scores);
  return success(res, { scores, comparison });
});

module.exports = { getLatestReport, getReportById, listReports, getAnalytics, getComparison };
