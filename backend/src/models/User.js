const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async create({ name, email, password }) {
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  async saveRefreshToken(userId, token) {
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?',
      [userId, token, token]
    );
  },

  async findRefreshToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE token = ?',
      [token]
    );
    return rows[0] || null;
  },

  async deleteRefreshToken(token) {
    await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  },
};

module.exports = User;
