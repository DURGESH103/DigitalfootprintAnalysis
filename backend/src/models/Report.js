const { pool } = require('../config/database');

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
    return {
      ...rows[0],
      insights: JSON.parse(rows[0].insights),
      scores: JSON.parse(rows[0].scores),
    };
  },

  async findById(reportId, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM reports WHERE id = ? AND user_id = ?',
      [reportId, userId]
    );
    if (!rows[0]) return null;
    return {
      ...rows[0],
      insights: JSON.parse(rows[0].insights),
      scores: JSON.parse(rows[0].scores),
    };
  },

  async findAllByUser(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute(
      'SELECT id, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM reports WHERE user_id = ?',
      [userId]
    );
    return { rows, total };
  },
};

module.exports = Report;
