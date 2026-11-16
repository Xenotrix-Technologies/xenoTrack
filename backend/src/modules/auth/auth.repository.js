const db = require('../../core/config/database');

class AuthRepository {
  async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT u.*, sp.id as staff_profile_id, sp.can_collect_fees, sp.can_edit_attendance
       FROM users u
       LEFT JOIN staff_profiles sp ON sp.user_id = u.id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, institute_id, email, role, full_name, is_active FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async getStaffProfile(userId) {
    const [rows] = await db.query('SELECT * FROM staff_profiles WHERE user_id = ?', [userId]);
    return rows[0] || null;
  }

  async saveRefreshToken(userId, tokenHash, expiresAt) {
    return db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
  }

  async findValidRefreshToken(tokenHash) {
    const [rows] = await db.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async deleteRefreshToken(tokenHash) {
    return db.query('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
  }

  async deleteRefreshTokensByUserId(userId) {
    return db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }

  async updateLastLogin(userId) {
    return db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
  }

  async getPasswordHash(userId) {
    const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    return rows[0] ? rows[0].password_hash : null;
  }

  async updatePassword(userId, passwordHash) {
    return db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  }
}

module.exports = new AuthRepository();
