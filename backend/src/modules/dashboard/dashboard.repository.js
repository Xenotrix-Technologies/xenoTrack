const db = require('../../core/config/database');

class DashboardRepository {
  async getAdminStats(instituteId, today, monthStart) {
    const [[{ totalMembers }]] = await db.query(
      "SELECT COUNT(*) as totalMembers FROM members WHERE institute_id = ? AND status = 'active'",
      [instituteId]
    );
    const [[{ totalStaff }]] = await db.query(
      "SELECT COUNT(*) as totalStaff FROM staff_profiles WHERE institute_id = ? AND status = 'active'",
      [instituteId]
    );
    const [[{ totalGroups }]] = await db.query(
      "SELECT COUNT(*) as totalGroups FROM `groups` WHERE institute_id = ? AND status = 'active'",
      [instituteId]
    );
    const [[{ todayAttendance }]] = await db.query(
      `SELECT COUNT(*) as todayAttendance FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       WHERE s.institute_id = ? AND s.session_date = ? AND ar.status = 'present'`,
      [instituteId, today]
    );
    const [[{ totalEnrolled }]] = await db.query(
      `SELECT COUNT(DISTINCT ar.member_id) as totalEnrolled FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       WHERE s.institute_id = ? AND s.session_date = ?`,
      [instituteId, today]
    );
    const attendancePct = totalEnrolled > 0 ? Math.round((todayAttendance / totalEnrolled) * 100) : 0;

    const [[{ feesCollectedThisMonth }]] = await db.query(
      `SELECT COALESCE(SUM(amount),0) as feesCollectedThisMonth FROM payments
       WHERE institute_id = ? AND payment_date >= ? AND is_reversed = FALSE`,
      [instituteId, monthStart]
    );
    const [[{ pendingFees }]] = await db.query(
      `SELECT COALESCE(SUM(outstanding_balance),0) as pendingFees FROM fee_records
       WHERE institute_id = ? AND status IN ('unpaid','partially_paid','overdue')`,
      [instituteId]
    );
    const [[{ overdueCount }]] = await db.query(
      "SELECT COUNT(*) as overdueCount FROM fee_records WHERE institute_id = ? AND status = 'overdue'",
      [instituteId]
    );

    return {
      totalMembers,
      totalStaff,
      totalGroups,
      todayAttendance,
      attendancePct,
      feesCollectedThisMonth,
      pendingFees,
      overdueCount
    };
  }

  async getRecentPayments(instituteId, limit = 5) {
    const [recentPayments] = await db.query(
      `SELECT p.*, m.full_name as member_name, m.member_code, u.full_name as collected_by_name
       FROM payments p
       JOIN members m ON m.id = p.member_id
       JOIN users u ON u.id = p.collected_by
       WHERE p.institute_id = ? AND p.is_reversed = FALSE
       ORDER BY p.created_at DESC LIMIT ?`,
      [instituteId, limit]
    );
    return recentPayments;
  }

  async getRecentMembers(instituteId, limit = 5) {
    const [recentMembers] = await db.query(
      `SELECT id, member_code, full_name, phone, registration_date, status
       FROM members WHERE institute_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [instituteId, limit]
    );
    return recentMembers;
  }

  async getMonthlyCollection(instituteId) {
    const [monthlyCollection] = await db.query(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') as month,
              COALESCE(SUM(amount),0) as total
       FROM payments WHERE institute_id = ? AND is_reversed = 0
         AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month`,
      [instituteId]
    );
    return monthlyCollection;
  }

  async getAttendanceTrend(instituteId) {
    const [attendanceTrend] = await db.query(
      `SELECT s.session_date as date,
              SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present,
              COUNT(ar.id) as total
       FROM attendance_sessions s
       LEFT JOIN attendance_records ar ON ar.session_id = s.id
       WHERE s.institute_id = ? AND s.session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY s.session_date ORDER BY s.session_date`,
      [instituteId]
    );
    return attendanceTrend;
  }

  async getFeeBreakdown(instituteId) {
    const [feeBreakdown] = await db.query(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(final_amount),0) as amount
       FROM fee_records WHERE institute_id = ?
       GROUP BY status`,
      [instituteId]
    );
    return feeBreakdown;
  }

  async getStaffProfileByUserId(userId) {
    const [spRows] = await db.query('SELECT id FROM staff_profiles WHERE user_id = ?', [userId]);
    return spRows[0] || null;
  }

  async getAssignedGroupsForStaff(staffProfileId) {
    const [assignedGroups] = await db.query(
      `SELECT g.*, p.name as program_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.group_id = g.id AND e.status = 'active') as member_count
       FROM group_staff_assignments gsa
       JOIN \`groups\` g ON g.id = gsa.group_id
       JOIN programs p ON p.id = g.program_id
       WHERE gsa.staff_profile_id = ? AND g.status = 'active'`,
      [staffProfileId]
    );
    return assignedGroups;
  }

  async getStaffTodaySessions(groupIds, today) {
    if (!groupIds.length) return [];
    const [todaySessions] = await db.query(
      `SELECT s.*, g.name as group_name FROM attendance_sessions s
       JOIN \`groups\` g ON g.id = s.group_id
       WHERE s.group_id IN (?) AND s.session_date = ?`,
      [groupIds, today]
    );
    return todaySessions;
  }

  async getStaffRecentAttendance(groupIds) {
    if (!groupIds.length) return [];
    const [recentAttendance] = await db.query(
      `SELECT s.session_date, g.name as group_name, s.status,
              SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) as present_count,
              COUNT(ar.id) as total_count
       FROM attendance_sessions s
       JOIN \`groups\` g ON g.id = s.group_id
       LEFT JOIN attendance_records ar ON ar.session_id = s.id
       WHERE s.group_id IN (?) AND s.session_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY s.id, g.name, s.session_date, s.status ORDER BY s.session_date DESC LIMIT 10`,
      [groupIds]
    );
    return recentAttendance;
  }

  async getStaffMembersCount(groupIds) {
    if (!groupIds.length) return 0;
    const [[res]] = await db.query(
      "SELECT COUNT(DISTINCT e.member_id) as membersCount FROM enrollments e WHERE e.group_id IN (?) AND e.status='active'",
      [groupIds]
    );
    return res ? res.memberscount || res.membersCount || 0 : 0;
  }
}

module.exports = new DashboardRepository();
