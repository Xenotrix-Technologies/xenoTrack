const db = require('../../core/config/database');

class ProgramRepository {
  async findAll(instituteId, status) {
    let where = 'p.institute_id = ?';
    const params = [instituteId];
    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }
    const [programs] = await db.query(
      `SELECT p.*, fp.name as default_fee_plan_name,
              COUNT(DISTINCT g.id) as group_count,
              COUNT(DISTINCT e.member_id) as member_count
       FROM programs p
       LEFT JOIN fee_plans fp ON fp.id = p.default_fee_plan_id
       LEFT JOIN \`groups\` g ON g.program_id = p.id AND g.status = 'active'
       LEFT JOIN enrollments e ON e.program_id = p.id AND e.status = 'active'
       WHERE ${where}
       GROUP BY p.id, fp.name ORDER BY p.name`,
      params
    );
    return programs;
  }

  async findById(id, instituteId) {
    const [rows] = await db.query('SELECT * FROM programs WHERE id = ? AND institute_id = ?', [id, instituteId]);
    return rows[0] || null;
  }

  async create(data) {
    const [result] = await db.query(
      'INSERT INTO programs (institute_id, name, description, program_type, default_fee_plan_id) VALUES (?, ?, ?, ?, ?)',
      [
        data.institute_id,
        data.name,
        data.description || null,
        data.program_type || null,
        data.default_fee_plan_id || null
      ]
    );
    return result.insertId;
  }

  async update(id, instituteId, data) {
    await db.query(
      'UPDATE programs SET name=?, description=?, program_type=?, default_fee_plan_id=?, status=? WHERE id=? AND institute_id=?',
      [
        data.name,
        data.description || null,
        data.program_type || null,
        data.default_fee_plan_id ? parseInt(data.default_fee_plan_id, 10) : null,
        data.status || 'active',
        id,
        instituteId
      ]
    );
  }
}

module.exports = new ProgramRepository();
