const db = require('../../core/config/database');

class StaffRepository {
  async findAll({ instituteId, status, search }) {
    let where = 'sp.institute_id = ?';
    const params = [instituteId];
    if (status) {
      where += ' AND sp.status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR sp.staff_code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [staff] = await db.query(
      `SELECT sp.*, sp.id as staff_profile_id, u.full_name, u.email, u.phone, u.is_active,
              STRING_AGG(DISTINCT g.name, ', ' ORDER BY g.name) as assigned_groups
       FROM staff_profiles sp
       JOIN users u ON u.id = sp.user_id
       LEFT JOIN group_staff_assignments gsa ON gsa.staff_profile_id = sp.id
       LEFT JOIN \`groups\` g ON g.id = gsa.group_id AND g.status = 'active'
       WHERE ${where}
       GROUP BY sp.id, u.id, u.full_name, u.email, u.phone, u.is_active ORDER BY u.full_name`,
      params
    );
    return staff;
  }

  async findById(id, instituteId) {
    const [rows] = await db.query(
      `SELECT sp.*, u.full_name, u.email, u.phone, u.is_active, u.last_login
       FROM staff_profiles sp JOIN users u ON u.id = sp.user_id
       WHERE sp.id = ? AND sp.institute_id = ?`,
      [id, instituteId]
    );
    return rows[0] || null;
  }

  async getStaffGroups(staffProfileId) {
    const [groups] = await db.query(
      `SELECT g.id, g.name, p.name as program_name, gsa.is_primary
       FROM group_staff_assignments gsa
       JOIN \`groups\` g ON g.id = gsa.group_id
       JOIN programs p ON p.id = g.program_id
       WHERE gsa.staff_profile_id = ?`,
      [staffProfileId]
    );
    return groups;
  }

  async findUserByEmailAndInstitute(email, instituteId) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND institute_id = ?', [
      email.toLowerCase(),
      instituteId
    ]);
    return rows[0] || null;
  }

  async createUser(instituteId, email, passwordHash, fullName, phone) {
    const [result] = await db.query(
      "INSERT INTO users (institute_id, email, password_hash, role, full_name, phone) VALUES (?, ?, ?, 'staff', ?, ?)",
      [instituteId, email.toLowerCase(), passwordHash, fullName, phone || null]
    );
    return result.insertId;
  }

  async getMaxStaffId(instituteId) {
    const [[{ maxId }]] = await db.query('SELECT MAX(id) as maxId FROM staff_profiles WHERE institute_id = ?', [
      instituteId
    ]);
    return maxId || 0;
  }

  async getStaffCodePrefix(instituteId) {
    const [rows] = await db.query(
      "SELECT setting_value FROM institute_settings WHERE institute_id = ? AND setting_key = 'staff_code_prefix'",
      [instituteId]
    );
    return rows[0]?.setting_value || 'STF';
  }

  async createProfile(data) {
    const [result] = await db.query(
      `INSERT INTO staff_profiles (user_id, institute_id, staff_code, designation, joining_date, can_collect_fees, can_edit_attendance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.institute_id,
        data.staff_code,
        data.designation || null,
        data.joining_date || null,
        data.can_collect_fees ? true : false,
        data.can_edit_attendance !== false
      ]
    );
    return result.insertId;
  }

  async update(id, userId, data) {
    await db.query('UPDATE users SET full_name=?, phone=? WHERE id=?', [data.full_name, data.phone || null, userId]);
    await db.query(
      'UPDATE staff_profiles SET designation=?, joining_date=?, can_collect_fees=?, can_edit_attendance=?, status=? WHERE id=?',
      [
        data.designation || null,
        data.joining_date || null,
        data.can_collect_fees ? true : false,
        data.can_edit_attendance !== false,
        data.status || 'active',
        id
      ]
    );
  }

  async updatePassword(userId, passwordHash) {
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }
}

module.exports = new StaffRepository();
