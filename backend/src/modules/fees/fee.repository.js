const db = require('../../core/config/database');

class FeeRepository {
  async listPlans(instituteId, status) {
    let where = 'institute_id = ?';
    const params = [instituteId];
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    const [plans] = await db.query(`SELECT * FROM fee_plans WHERE ${where} ORDER BY name`, params);
    return plans;
  }

  async findPlanById(id, instituteId) {
    const [rows] = await db.query('SELECT * FROM fee_plans WHERE id = ? AND institute_id = ?', [id, instituteId]);
    return rows[0] || null;
  }

  async createPlan(data) {
    const [result] = await db.query(
      `INSERT INTO fee_plans (institute_id, name, description, amount, frequency, due_day, late_fee_amount, late_fee_after_days, discount_amount, discount_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.institute_id,
        data.name,
        data.description || null,
        data.amount,
        data.frequency || 'monthly',
        data.due_day || null,
        data.late_fee_amount || 0,
        data.late_fee_after_days || 0,
        data.discount_amount || 0,
        data.discount_type || 'flat'
      ]
    );
    return result.insertId;
  }

  async updatePlan(id, instituteId, data) {
    await db.query(
      `UPDATE fee_plans SET name=?, description=?, amount=?, frequency=?, due_day=?, late_fee_amount=?, late_fee_after_days=?, discount_amount=?, discount_type=?, status=?
       WHERE id=? AND institute_id=?`,
      [
        data.name,
        data.description || null,
        data.amount,
        data.frequency || 'monthly',
        data.due_day || null,
        data.late_fee_amount || 0,
        data.late_fee_after_days || 0,
        data.discount_amount || 0,
        data.discount_type || 'flat',
        data.status || 'active',
        id,
        instituteId
      ]
    );
  }

  async listRecords({ instituteId, memberId, status, fromDate, toDate, limit, offset }) {
    let where = 'fr.institute_id = ?';
    const params = [instituteId];
    if (memberId) {
      where += ' AND fr.member_id = ?';
      params.push(memberId);
    }
    if (status) {
      where += ' AND fr.status = ?';
      params.push(status);
    }
    if (fromDate) {
      where += ' AND fr.due_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      where += ' AND fr.due_date <= ?';
      params.push(toDate);
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM fee_records fr WHERE ${where}`, params);
    const [records] = await db.query(
      `SELECT fr.*, m.full_name as member_name, m.member_code, fp.name as fee_plan_name
       FROM fee_records fr
       JOIN members m ON m.id = fr.member_id
       LEFT JOIN fee_plans fp ON fp.id = fr.fee_plan_id
       WHERE ${where}
       ORDER BY fr.due_date DESC LIMIT ? OFFSET ?`,
      [...params, +limit, +offset]
    );
    return { records, total: parseInt(total, 10) || 0 };
  }

  async findRecordById(id, instituteId) {
    const [rows] = await db.query('SELECT * FROM fee_records WHERE id = ? AND institute_id = ?', [id, instituteId]);
    return rows[0] || null;
  }

  async createRecord(data) {
    const [result] = await db.query(
      `INSERT INTO fee_records (institute_id, member_id, enrollment_id, fee_plan_id, billing_period_label, original_amount, discount_amount, late_fee_amount, final_amount, due_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.institute_id,
        data.member_id,
        data.enrollment_id || null,
        data.fee_plan_id || null,
        data.billing_period_label || null,
        data.original_amount,
        data.discount_amount,
        data.late_fee_amount,
        data.final_amount,
        data.due_date || null,
        data.notes || null,
        data.userId
      ]
    );
    return result.insertId;
  }

  async updateRecord(id, data) {
    await db.query(
      'UPDATE fee_records SET discount_amount=?, late_fee_amount=?, final_amount=?, notes=?, status=? WHERE id=?',
      [data.discount_amount, data.late_fee_amount, data.final_amount, data.notes, data.status, id]
    );
  }
}

module.exports = new FeeRepository();
