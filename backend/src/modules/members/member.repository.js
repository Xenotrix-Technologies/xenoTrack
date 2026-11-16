const db = require('../../core/config/database');

class MemberRepository {
  async findAndCountAll({ instituteId, search, status, programId, groupId, limit, offset }) {
    let where = ['m.institute_id = ?'];
    const params = [instituteId];

    if (search) {
      where.push('(m.full_name LIKE ? OR m.member_code LIKE ? OR m.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push('m.status = ?');
      params.push(status);
    }
    if (programId) {
      where.push("EXISTS (SELECT 1 FROM enrollments e WHERE e.member_id = m.id AND e.program_id = ? AND e.status = 'active')");
      params.push(programId);
    }
    if (groupId) {
      where.push("EXISTS (SELECT 1 FROM enrollments e WHERE e.member_id = m.id AND e.group_id = ? AND e.status = 'active')");
      params.push(groupId);
    }

    const whereStr = where.join(' AND ');
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM members m WHERE ${whereStr}`, params);

    const [members] = await db.query(
      `SELECT m.id, m.member_code, m.full_name, m.phone, m.email, m.gender, m.status, m.registration_date, m.profile_photo,
              STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as programs
       FROM members m
       LEFT JOIN enrollments e ON e.member_id = m.id AND e.status = 'active'
       LEFT JOIN programs p ON p.id = e.program_id
       WHERE ${whereStr}
       GROUP BY m.id
       ORDER BY m.full_name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return { members, total: parseInt(total, 10) || 0 };
  }

  async findById(id, instituteId) {
    const [rows] = await db.query('SELECT * FROM members WHERE id = ? AND institute_id = ?', [id, instituteId]);
    return rows[0] || null;
  }

  async getMemberDetails(id) {
    const [enrollments] = await db.query(
      `SELECT e.*, p.name as program_name, g.name as group_name, fp.name as fee_plan_name
       FROM enrollments e
       LEFT JOIN programs p ON p.id = e.program_id
       LEFT JOIN \`groups\` g ON g.id = e.group_id
       LEFT JOIN fee_plans fp ON fp.id = e.fee_plan_id
       WHERE e.member_id = ?`,
      [id]
    );

    const [feeRecords] = await db.query(
      'SELECT * FROM fee_records WHERE member_id = ? ORDER BY due_date DESC LIMIT 10',
      [id]
    );

    const [payments] = await db.query(
      `SELECT p.*, u.full_name as collected_by_name
       FROM payments p
       JOIN users u ON u.id = p.collected_by
       WHERE p.member_id = ? ORDER BY p.payment_date DESC LIMIT 10`,
      [id]
    );

    return { enrollments, feeRecords, payments };
  }

  async getMaxId(instituteId) {
    const [[{ maxId }]] = await db.query('SELECT MAX(id) as maxId FROM members WHERE institute_id = ?', [instituteId]);
    return maxId || 0;
  }

  async getMemberCodePrefix(instituteId) {
    const [rows] = await db.query(
      "SELECT setting_value FROM institute_settings WHERE institute_id = ? AND setting_key = 'member_code_prefix'",
      [instituteId]
    );
    return rows[0]?.setting_value || 'MEM';
  }

  async create(data) {
    const [result] = await db.query(
      `INSERT INTO members (institute_id, member_code, full_name, phone, email, dob, gender, address, emergency_contact, notes, registration_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.institute_id,
        data.member_code,
        data.full_name,
        data.phone || null,
        data.email || null,
        data.dob || null,
        data.gender || null,
        data.address || null,
        data.emergency_contact || null,
        data.notes || null,
        data.registration_date || new Date().toISOString().slice(0, 10),
        data.userId
      ]
    );
    return result.insertId;
  }

  async update(id, data) {
    await db.query(
      `UPDATE members SET full_name=?, phone=?, email=?, dob=?, gender=?, address=?, emergency_contact=?, notes=?, updated_at=NOW()
       WHERE id=?`,
      [
        data.full_name,
        data.phone || null,
        data.email || null,
        data.dob || null,
        data.gender || null,
        data.address || null,
        data.emergency_contact || null,
        data.notes || null,
        id
      ]
    );
  }

  async updateStatus(id, status) {
    await db.query('UPDATE members SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  }
}

module.exports = new MemberRepository();
