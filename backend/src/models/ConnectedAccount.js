const { pool } = require('../config/database');

const ConnectedAccount = {
  async upsert(userId, platform, username, accessToken = null) {
    await pool.execute(
      `INSERT INTO connected_accounts (user_id, platform, username, access_token)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE username = ?, access_token = ?, updated_at = NOW()`,
      [userId, platform, username, accessToken, username, accessToken]
    );
  },

  async findByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT id, platform, username, created_at, updated_at FROM connected_accounts WHERE user_id = ?',
      [userId]
    );
    return rows;
  },

  async findOne(userId, platform) {
    const [rows] = await pool.execute(
      'SELECT * FROM connected_accounts WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );
    return rows[0] || null;
  },

  async delete(userId, platform) {
    await pool.execute(
      'DELETE FROM connected_accounts WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );
  },
};

module.exports = ConnectedAccount;
