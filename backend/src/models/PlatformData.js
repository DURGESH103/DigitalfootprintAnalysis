const { pool } = require('../config/database');

const parseJSON = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
};

const PlatformData = {
  async upsert(userId, platform, rawData) {
    await pool.execute(
      `INSERT INTO platform_data (user_id, platform, raw_data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE raw_data = ?, fetched_at = NOW()`,
      [userId, platform, JSON.stringify(rawData), JSON.stringify(rawData)]
    );
  },

  async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT platform, raw_data, fetched_at FROM platform_data WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => ({ ...r, raw_data: parseJSON(r.raw_data) }));
  },

  async findOne(userId, platform) {
    const [rows] = await pool.execute(
      'SELECT * FROM platform_data WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );
    if (!rows[0]) return null;
    return { ...rows[0], raw_data: parseJSON(rows[0].raw_data) };
  },
};

const NormalizedData = {
  async upsert(userId, platform, data) {
    const { activity_score, consistency_score, skill_tags, engagement_score, growth_score } = data;
    await pool.execute(
      `INSERT INTO normalized_data (user_id, platform, activity_score, consistency_score, skill_tags, engagement_score, growth_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         activity_score = ?, consistency_score = ?, skill_tags = ?,
         engagement_score = ?, growth_score = ?, updated_at = NOW()`,
      [
        userId, platform, activity_score, consistency_score, JSON.stringify(skill_tags), engagement_score, growth_score,
        activity_score, consistency_score, JSON.stringify(skill_tags), engagement_score, growth_score,
      ]
    );
  },

  async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM normalized_data WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => ({ ...r, skill_tags: parseJSON(r.skill_tags) || [] }));
  },
};

module.exports = { PlatformData, NormalizedData };
