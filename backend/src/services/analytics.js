const { pool } = require('../config/database');

const getWeeklyTrends = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT 
       YEARWEEK(created_at, 1) as week,
       AVG(JSON_EXTRACT(scores, '$.hireability_score')) as avg_hireability,
       AVG(JSON_EXTRACT(scores, '$.consistency_score')) as avg_consistency,
       AVG(JSON_EXTRACT(scores, '$.growth_score')) as avg_growth,
       COUNT(*) as reports
     FROM reports
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
     GROUP BY YEARWEEK(created_at, 1)
     ORDER BY week ASC`,
    [userId]
  );
  return rows;
};

const getMonthlyGrowth = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT 
       DATE_FORMAT(created_at, '%Y-%m') as month,
       AVG(JSON_EXTRACT(scores, '$.hireability_score')) as avg_hireability,
       AVG(JSON_EXTRACT(scores, '$.problem_solving_score')) as avg_problem_solving,
       AVG(JSON_EXTRACT(scores, '$.development_score')) as avg_development,
       COUNT(*) as reports
     FROM reports
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month ASC`,
    [userId]
  );
  return rows;
};

const getPlatformTrends = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT platform, activity_score, consistency_score, engagement_score, growth_score, updated_at
     FROM normalized_data
     WHERE user_id = ?
     ORDER BY updated_at DESC`,
    [userId]
  );
  return rows;
};

module.exports = { getWeeklyTrends, getMonthlyGrowth, getPlatformTrends };
