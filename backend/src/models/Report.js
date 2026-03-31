const { pool } = require('../config/database');

// mysql2 may return JSON columns as already-parsed objects or as strings
const parseJSON = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return val; // already parsed by mysql2
  try { return JSON.parse(val); } catch { return null; }
};

const parseReport = (row) => ({
  ...row,
  insights: parseJSON(row.insights),
  scores: parseJSON(row.scores),
});

const Report = {
  async create(userId, insights, scores) {
    const [result] = await pool.execute(
      'INSERT INTO reports (user_id, insights, scores) VALUES (?, ?, ?)',
      [userId, JSON.stringify(insights), JSON.stringify(scores)]
    );
    return result.insertId;
  },

  async findLatestByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (!rows[0]) return null;
    return parseReport(rows[0]);
  },

  async findById(reportId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM reports WHERE id = ? AND user_id = ?',
      [reportId, userId]
    );
    if (!rows[0]) return null;
    return parseReport(rows[0]);
  },

  async findAllByUser(userId, page = 1, limit = 10) {
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const safeOffset = Math.max((parseInt(page, 10) - 1) * safeLimit, 0);
    const [rows] = await pool.query(
      `SELECT id, created_at,
         JSON_EXTRACT(scores, '$.hireability_score') as hireability_score,
         JSON_EXTRACT(scores, '$.behavior_type')     as behavior_type
       FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM reports WHERE user_id = ?',
      [userId]
    );
    return { rows, total: parseInt(total, 10) };
  },
};

module.exports = Report;
