const db = require('../../core/config/database');

class PaymentRepository {
  async list({ instituteId, memberId, fromDate, toDate, paymentMethod, collectedBy, limit, offset }) {
    let where = 'p.institute_id = ? AND p.is_reversed = FALSE';
    const params = [instituteId];
    if (memberId) {
      where += ' AND p.member_id = ?';
      params.push(memberId);
    }
    if (fromDate) {
      where += ' AND p.payment_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      where += ' AND p.payment_date <= ?';
      params.push(toDate);
    }
    if (paymentMethod) {
      where += ' AND p.payment_method = ?';
      params.push(paymentMethod);
    }
    if (collectedBy) {
      where += ' AND p.collected_by = ?';
      params.push(collectedBy);
    }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM payments p WHERE ${where}`, params);
    const [payments] = await db.query(
      `SELECT p.*, m.full_name as member_name, m.member_code,
              u.full_name as collected_by_name,
              fr.billing_period_label, fr.final_amount as fee_amount
       FROM payments p
       JOIN members m ON m.id = p.member_id
       JOIN users u ON u.id = p.collected_by
       JOIN fee_records fr ON fr.id = p.fee_record_id
       WHERE ${where}
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, +limit, +offset]
    );

    return { payments, total: parseInt(total, 10) || 0 };
  }

  async getReceiptData(id, instituteId) {
    const [rows] = await db.query(
      `SELECT p.*,
              m.full_name as member_name, m.member_code,
              u.full_name as collected_by_name,
              fr.billing_period_label, fr.final_amount, fr.amount_paid, fr.outstanding_balance,
              i.name as institute_name, i.address as institute_address, i.phone as institute_phone, i.logo_url,
              g.name as group_name, prog.name as program_name
       FROM payments p
       JOIN members m ON m.id = p.member_id
       JOIN users u ON u.id = p.collected_by
       JOIN fee_records fr ON fr.id = p.fee_record_id
       JOIN institutes i ON i.id = p.institute_id
       LEFT JOIN enrollments e ON e.id = fr.enrollment_id
       LEFT JOIN \`groups\` g ON g.id = e.group_id
       LEFT JOIN programs prog ON prog.id = e.program_id
       WHERE p.id = ? AND p.institute_id = ?`,
      [id, instituteId]
    );
    return rows[0] || null;
  }

  async getReceiptPrefix(instituteId) {
    const [rows] = await db.query(
      "SELECT setting_value FROM institute_settings WHERE institute_id = ? AND setting_key = 'receipt_prefix'",
      [instituteId]
    );
    return rows[0]?.setting_value || 'RCP';
  }

  async getLastReceiptId(instituteId) {
    const [[{ lastReceipt }]] = await db.query(
      'SELECT MAX(id) as lastReceipt FROM payments WHERE institute_id = ?',
      [instituteId]
    );
    return lastReceipt || 0;
  }

  async findPaymentById(id) {
    const [payment] = await db.query(
      `SELECT p.*, m.full_name as member_name, m.member_code, u.full_name as collected_by_name,
              fr.billing_period_label, fr.final_amount as fee_amount, fr.outstanding_balance
       FROM payments p
       JOIN members m ON m.id = p.member_id JOIN users u ON u.id = p.collected_by
       JOIN fee_records fr ON fr.id = p.fee_record_id
       WHERE p.id = ?`,
      [id]
    );
    return payment[0] || null;
  }

  async getConnection() {
    return db.getConnection();
  }
}

module.exports = new PaymentRepository();
