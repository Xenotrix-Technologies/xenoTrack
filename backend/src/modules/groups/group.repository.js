const db = require('../../core/config/database');

class GroupRepository {
  async findAll({ instituteId, programId, status, staffId }) {
    let where = 'g.institute_id = ?';
    const params = [instituteId];
    if (programId) {
      where += ' AND g.program_id = ?';
      params.push(programId);
    }
    if (status) {
      where += ' AND g.status = ?';
      params.push(status);
    }
    if (staffId) {
      where += ' AND EXISTS (SELECT 1 FROM group_staff_assignments gsa WHERE gsa.group_id = g.id AND gsa.staff_profile_id = ?)';
      params.push(staffId);
    }

    const [groups] = await db.query(
      `SELECT g.*, p.name as program_name,
              COUNT(DISTINCT e.member_id) as member_count,
              STRING_AGG(DISTINCT u.full_name, ', ' ORDER BY u.full_name) as staff_names
       FROM \`groups\` g
       JOIN programs p ON p.id = g.program_id
       LEFT JOIN enrollments e ON e.group_id = g.id AND e.status = 'active'
       LEFT JOIN group_staff_assignments gsa ON gsa.group_id = g.id
       LEFT JOIN staff_profiles sp ON sp.id = gsa.staff_profile_id
       LEFT JOIN users u ON u.id = sp.user_id
       WHERE ${where}
       GROUP BY g.id, p.name ORDER BY g.name`,
      params
    );
    return groups;
  }

  async findById(id, instituteId) {
    const [rows] = await db.query(
      `SELECT g.*, p.name as program_name FROM \`groups\` g
       JOIN programs p ON p.id = g.program_id
       WHERE g.id = ? AND g.institute_id = ?`,
      [id, instituteId]
    );
    return rows[0] || null;
  }

  async getGroupStaff(groupId) {
    const [staff] = await db.query(
      `SELECT sp.id as staff_profile_id, u.full_name, sp.designation, gsa.is_primary
       FROM group_staff_assignments gsa
       JOIN staff_profiles sp ON sp.id = gsa.staff_profile_id
       JOIN users u ON u.id = sp.user_id
       WHERE gsa.group_id = ?`,
      [groupId]
    );
    return staff;
  }

  async getGroupMembers(groupId) {
    const [members] = await db.query(
      `SELECT m.id, m.member_code, m.full_name, m.phone, m.status, e.status as enrollment_status, e.id as enrollment_id
       FROM enrollments e JOIN members m ON m.id = e.member_id
       WHERE e.group_id = ? ORDER BY m.full_name`,
      [groupId]
    );
    return members;
  }

  async create(data) {
    const [result] = await db.query(
      `INSERT INTO \`groups\` (institute_id, program_id, name, start_date, end_date, scheduled_days, start_time, end_time, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.institute_id,
        data.program_id,
        data.name,
        data.start_date || null,
        data.end_date || null,
        data.scheduled_days,
        data.start_time || null,
        data.end_time || null,
        data.capacity ? parseInt(data.capacity, 10) : null
      ]
    );
    return result.insertId;
  }

  async update(id, instituteId, data) {
    await db.query(
      `UPDATE \`groups\` SET name=?, start_date=?, end_date=?, scheduled_days=?, start_time=?, end_time=?, capacity=?, status=?
       WHERE id=? AND institute_id=?`,
      [
        data.name,
        data.start_date || null,
        data.end_date || null,
        data.scheduled_days,
        data.start_time || null,
        data.end_time || null,
        data.capacity ? parseInt(data.capacity, 10) : null,
        data.status || 'active',
        id,
        instituteId
      ]
    );
  }

  async assignStaff(groupId, staffProfileId, isPrimary) {
    return db.query(
      `INSERT INTO group_staff_assignments (group_id, staff_profile_id, is_primary)
       VALUES (?, ?, ?)
       ON CONFLICT (group_id, staff_profile_id) DO UPDATE SET is_primary = EXCLUDED.is_primary`,
      [groupId, staffProfileId, isPrimary ? true : false]
    );
  }

  async removeStaff(groupId, staffProfileId) {
    return db.query(
      'DELETE FROM group_staff_assignments WHERE group_id = ? AND staff_profile_id = ?',
      [groupId, staffProfileId]
    );
  }

  async findExistingEnrollment(memberId, programId, groupId) {
    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE member_id=? AND program_id=? AND group_id IS NOT DISTINCT FROM ?',
      [memberId, programId, groupId || null]
    );
    return existing[0] || null;
  }

  async createEnrollment(data) {
    const [result] = await db.query(
      'INSERT INTO enrollments (institute_id, member_id, program_id, group_id, fee_plan_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [
        data.institute_id,
        data.member_id,
        data.program_id,
        data.group_id || null,
        data.fee_plan_id || null,
        data.notes || null
      ]
    );
    return result.insertId;
  }

  async updateEnrollment(id, instituteId, data) {
    return db.query(
      'UPDATE enrollments SET status=?, fee_plan_id=?, notes=? WHERE id=? AND institute_id=?',
      [data.status, data.fee_plan_id || null, data.notes || null, id, instituteId]
    );
  }
}

module.exports = new GroupRepository();
