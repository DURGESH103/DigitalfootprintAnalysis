const { pool } = require('../config/database');

const Notification = {
  async create(userId, type, title, message, meta = null) {
    const [result] = await pool.execute(
      'INSERT INTO notifications (user_id, type, title, message, meta) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, meta ? JSON.stringify(meta) : null]
    );
    return result.insertId;
  },

  async findByUser(userId, limit = 20) {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows.map((r) => ({ ...r, meta: r.meta ? JSON.parse(r.meta) : null }));
  },

  async markRead(userId, notificationId) {
    await pool.execute(
      'UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
  },

  async markAllRead(userId) {
    await pool.execute(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );
  },

  async unreadCount(userId) {
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );
    return count;
  },
};

module.exports = Notification;
