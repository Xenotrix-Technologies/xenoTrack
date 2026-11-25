const db = require('../../core/config/database');

class AttendanceRepository {
  async listSessions({ instituteId, groupId, fromDate, toDate, userRole, userId, limit, offset }) {
    let where = 's.institute_id = ?';
    const params = [instituteId];
    if (groupId) {
      where += ' AND s.group_id = ?';
      params.push(groupId);
    }
    if (fromDate) {
      where += ' AND s.session_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      where += ' AND s.session_date <= ?';
      params.push(toDate);
    }

    if (userRole === 'staff') {
      const [sp] = await db.query('SELECT id FROM staff_profiles WHERE user_id = ?', [userId]);
      if (sp.length) {
        where += ' AND s.group_id IN (SELECT group_id FROM group_staff_assignments WHERE staff_profile_id = ?)';
        params.push(sp[0].id);
      }
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM attendance_sessions s WHERE ${where}`, params);
    const [sessions] = await db.query(
      `SELECT s.*, g.name as group_name, p.name as program_name,
              u.full_name as created_by_name,
              COUNT(ar.id) as attendance_count,
              SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present_count
       FROM attendance_sessions s
       JOIN \`groups\` g ON g.id = s.group_id
       JOIN programs p ON p.id = g.program_id
       JOIN users u ON u.id = s.created_by
       LEFT JOIN attendance_records ar ON ar.session_id = s.id
       WHERE ${where}
       GROUP BY s.id, g.name, p.name, u.full_name
       ORDER BY s.session_date DESC, s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, +limit, +offset]
    );

    return { sessions, total: parseInt(total, 10) || 0 };
  }

  async findGroupById(groupId, instituteId) {
    const [grp] = await db.query('SELECT * FROM `groups` WHERE id = ? AND institute_id = ?', [groupId, instituteId]);
    return grp[0] || null;
  }

  async findExistingSession(groupId, sessionDate) {
    const [existing] = await db.query(
      'SELECT id FROM attendance_sessions WHERE group_id = ? AND session_date = ?',
      [groupId, sessionDate]
    );
    return existing[0] || null;
  }

  async createSession(data) {
    const [result] = await db.query(
      'INSERT INTO attendance_sessions (institute_id, group_id, session_date, start_time, end_time, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.institute_id,
        data.group_id,
        data.session_date,
        data.start_time || null,
        data.end_time || null,
        data.notes || null,
        data.userId
      ]
    );
    return result.insertId;
  }

  async findSessionById(sessionId, instituteId) {
    const [sess] = await db.query(
      `SELECT s.*, g.name as group_name, p.name as program_name
       FROM attendance_sessions s
       JOIN \`groups\` g ON g.id = s.group_id
       JOIN programs p ON p.id = g.program_id
       WHERE s.id = ? AND s.institute_id = ?`,
      [sessionId, instituteId]
    );
    return sess[0] || null;
  }

  async getSessionRecords(sessionId, groupId) {
    const [enrolled] = await db.query(
      `SELECT m.id, m.id as member_id, m.member_code, m.full_name, m.phone, m.profile_photo,
              ar.id as record_id, ar.id as attendance_record_id,
              ar.status, ar.status as attendance_status,
              ar.note, ar.note as notes,
              ar.marked_by, ar.marked_at, u.full_name as marked_by_name
       FROM enrollments e
       JOIN members m ON m.id = e.member_id
       LEFT JOIN attendance_records ar ON ar.session_id = ? AND ar.member_id = m.id
       LEFT JOIN users u ON u.id = ar.marked_by
       WHERE e.group_id = ? AND e.status = 'active'
       ORDER BY m.full_name`,
      [sessionId, groupId]
    );
    return enrolled;
  }

  async getRecordWithSession(recordId) {
    const [rows] = await db.query(
      'SELECT ar.*, s.session_date FROM attendance_records ar JOIN attendance_sessions s ON s.id = ar.session_id WHERE ar.id = ?',
      [recordId]
    );
    return rows[0] || null;
  }

  async getStaffProfile(userId) {
    const [sp] = await db.query('SELECT * FROM staff_profiles WHERE user_id = ?', [userId]);
    return sp[0] || null;
  }

  async updateRecord(id, status, note, userId) {
    return db.query(
      'UPDATE attendance_records SET status = ?, note = ?, modified_by = ?, modified_at = NOW() WHERE id = ?',
      [status, note || null, userId, id]
    );
  }

  async getConnection() {
    return db.getConnection();
  }
}

module.exports = new AttendanceRepository();
