const db = require('../../core/config/database');

class ReportRepository {
  async getAttendanceReport({ instituteId, fromDate, toDate, groupId, programId, memberId, reportType }) {
    let where = 's.institute_id = ?';
    const params = [instituteId];
    if (fromDate) {
      where += ' AND s.session_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      where += ' AND s.session_date <= ?';
      params.push(toDate);
    }
    if (groupId) {
      where += ' AND s.group_id = ?';
      params.push(groupId);
    }
    if (programId) {
      where += ' AND s.group_id IN (SELECT id FROM `groups` WHERE program_id = ?)';
      params.push(programId);
    }
    if (memberId) {
      where += ' AND ar.member_id = ?';
      params.push(memberId);
    }

    if (reportType === 'member') {
      const [data] = await db.query(
        `SELECT m.member_code, m.full_name, g.name as group_name,
                COUNT(ar.id) as total_sessions,
                SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN ar.status='absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN ar.status='late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN ar.status='excused' THEN 1 ELSE 0 END) as excused,
                ROUND(SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ar.id),0),1) as attendance_pct
         FROM attendance_records ar
         JOIN attendance_sessions s ON s.id = ar.session_id
         JOIN members m ON m.id = ar.member_id
         JOIN \`groups\` g ON g.id = s.group_id
         WHERE ${where}
         GROUP BY m.id, m.member_code, m.full_name, g.id, g.name ORDER BY m.full_name`,
        params
      );
      return data;
    }

    if (reportType === 'daily') {
      const [data] = await db.query(
        `SELECT s.session_date as date, g.name as group_name,
                COUNT(DISTINCT ar.member_id) as total_marked,
                SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN ar.status='absent' THEN 1 ELSE 0 END) as absent
         FROM attendance_sessions s
         JOIN \`groups\` g ON g.id = s.group_id
         LEFT JOIN attendance_records ar ON ar.session_id = s.id
         WHERE ${where}
         GROUP BY s.session_date, s.group_id, g.name ORDER BY s.session_date DESC`,
        params
      );
      return data;
    }

    // Default: group summary
    const [data] = await db.query(
      `SELECT g.name as group_name, p.name as program_name,
              COUNT(DISTINCT s.id) as total_sessions,
              COUNT(ar.id) as total_records,
              SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present,
              ROUND(SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ar.id),0),1) as attendance_pct
       FROM attendance_sessions s
       JOIN \`groups\` g ON g.id = s.group_id
       JOIN programs p ON p.id = g.program_id
       LEFT JOIN attendance_records ar ON ar.session_id = s.id
       WHERE ${where}
       GROUP BY g.id, g.name, p.name ORDER BY g.name`,
      params
    );
    return data;
  }

  async getCollectionReport({ instituteId, fromDate, toDate, groupId, programId, staffId, paymentMethod }) {
    let where = 'p.institute_id = ? AND p.is_reversed = FALSE';
    const params = [instituteId];
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
    if (staffId) {
      where += ' AND p.collected_by = ?';
      params.push(staffId);
    }

    const [daily] = await db.query(
      `SELECT p.payment_date as date,
              COUNT(*) as payment_count,
              SUM(p.amount) as total_collected
       FROM payments p WHERE ${where}
       GROUP BY p.payment_date ORDER BY p.payment_date DESC`,
      params
    );

    const [byMethod] = await db.query(
      `SELECT p.payment_method, COUNT(*) as count, SUM(p.amount) as total
       FROM payments p WHERE ${where}
       GROUP BY p.payment_method`,
      params
    );

    const [byStaff] = await db.query(
      `SELECT u.full_name as staff_name, COUNT(*) as payment_count, SUM(p.amount) as total
       FROM payments p JOIN users u ON u.id = p.collected_by
       WHERE ${where}
       GROUP BY p.collected_by, u.full_name`,
      params
    );

    const [[{ grandTotal }]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) as grandTotal FROM payments p WHERE ${where}`,
      params
    );

    return { daily, byMethod, byStaff, grandTotal };
  }

  async getOutstandingReport({ instituteId, status, programId, groupId }) {
    let where = "fr.institute_id = ? AND fr.status NOT IN ('paid','waived')";
    const params = [instituteId];
    if (status) {
      where += ' AND fr.status = ?';
      params.push(status);
    }

    const [records] = await db.query(
      `SELECT fr.*, m.full_name as member_name, m.member_code, m.phone,
              fp.name as fee_plan_name,
              COALESCE(CURRENT_DATE - fr.due_date, 0) as days_overdue
       FROM fee_records fr
       JOIN members m ON m.id = fr.member_id
       LEFT JOIN fee_plans fp ON fp.id = fr.fee_plan_id
       WHERE ${where}
       ORDER BY fr.due_date ASC`,
      params
    );

    const [[{ totalOutstanding }]] = await db.query(
      `SELECT COALESCE(SUM(outstanding_balance),0) as totalOutstanding FROM fee_records fr
       WHERE ${where}`,
      params
    );

    return { records, totalOutstanding };
  }
}

module.exports = new ReportRepository();
