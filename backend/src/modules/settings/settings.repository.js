const db = require('../../core/config/database');

class SettingsRepository {
  async getInstitute(instituteId) {
    const [inst] = await db.query('SELECT * FROM institutes WHERE id = ?', [instituteId]);
    return inst[0] || null;
  }

  async getSettings(instituteId) {
    const [settings] = await db.query(
      'SELECT setting_key, setting_value FROM institute_settings WHERE institute_id = ?',
      [instituteId]
    );
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });
    return settingsMap;
  }

  async getActivityLogs({ instituteId, userId, action, entityType, fromDate, toDate, limit, offset }) {
    let where = 'al.institute_id = ?';
    const params = [instituteId];
    if (userId) {
      where += ' AND al.user_id = ?';
      params.push(userId);
    }
    if (action) {
      where += ' AND al.action LIKE ?';
      params.push(`%${action}%`);
    }
    if (entityType) {
      where += ' AND al.entity_type = ?';
      params.push(entityType);
    }
    if (fromDate) {
      where += ' AND DATE(al.created_at) >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      where += ' AND DATE(al.created_at) <= ?';
      params.push(toDate);
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM activity_logs al WHERE ${where}`, params);
    const [logs] = await db.query(
      `SELECT al.*, u.full_name as user_name, u.role
       FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id
       WHERE ${where}
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [...params, +limit, +offset]
    );

    return { logs, total: parseInt(total, 10) || 0 };
  }

  async getGenderOptions(instituteId, status) {
    let where = 'institute_id = ?';
    const params = [instituteId];
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    let [options] = await db.query(
      `SELECT * FROM gender_options WHERE ${where} ORDER BY display_order ASC, name ASC`,
      params
    );

    if (!options.length && !status) {
      const defaults = ['Male', 'Female', 'Other', 'Prefer not to say'];
      for (let i = 0; i < defaults.length; i++) {
        await db.query(
          `INSERT IGNORE INTO gender_options (institute_id, name, status, display_order)
           VALUES (?, ?, 'active', ?)`,
          [instituteId, defaults[i], i + 1]
        );
      }
      [options] = await db.query(
        'SELECT * FROM gender_options WHERE institute_id = ? ORDER BY display_order ASC, name ASC',
        [instituteId]
      );
    }

    return options;
  }

  async findGenderOptionByName(instituteId, name, excludeId = null) {
    let sql = 'SELECT id FROM gender_options WHERE institute_id = ? AND LOWER(name) = LOWER(?)';
    const params = [instituteId, name];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await db.query(sql, params);
    return rows[0] || null;
  }

  async findGenderOptionById(id, instituteId) {
    const [rows] = await db.query('SELECT * FROM gender_options WHERE id = ? AND institute_id = ?', [id, instituteId]);
    return rows[0] || null;
  }

  async getNextGenderDisplayOrder(instituteId) {
    const [[{ nextOrder }]] = await db.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as nextOrder FROM gender_options WHERE institute_id = ?',
      [instituteId]
    );
    return nextOrder || 1;
  }

  async createGenderOption(instituteId, name, status, displayOrder) {
    const [result] = await db.query(
      'INSERT INTO gender_options (institute_id, name, status, display_order) VALUES (?, ?, ?, ?)',
      [instituteId, name, status, displayOrder]
    );
    return { id: result.insertId, institute_id: instituteId, name, status, display_order: displayOrder };
  }

  async updateGenderOption(id, instituteId, name, status, displayOrder) {
    await db.query(
      'UPDATE gender_options SET name = ?, status = ?, display_order = ?, updated_at = NOW() WHERE id = ? AND institute_id = ?',
      [name, status, displayOrder, id, instituteId]
    );
    return this.findGenderOptionById(id, instituteId);
  }

  async toggleGenderOptionStatus(id, instituteId, nextStatus) {
    await db.query(
      'UPDATE gender_options SET status = ?, updated_at = NOW() WHERE id = ? AND institute_id = ?',
      [nextStatus, id, instituteId]
    );
    return this.findGenderOptionById(id, instituteId);
  }

  async countMembersWithGender(instituteId, genderName) {
    const [[{ memberCount }]] = await db.query(
      'SELECT COUNT(*) as memberCount FROM members WHERE institute_id = ? AND LOWER(gender) = LOWER(?)',
      [instituteId, genderName]
    );
    return parseInt(memberCount, 10) || 0;
  }

  async deleteGenderOption(id, instituteId) {
    return db.query('DELETE FROM gender_options WHERE id = ? AND institute_id = ?', [id, instituteId]);
  }

  async getConnection() {
    return db.getConnection();
  }
}

module.exports = new SettingsRepository();
