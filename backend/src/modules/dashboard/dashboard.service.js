const dashboardRepository = require('./dashboard.repository');

class DashboardService {
  async getAdminDashboard(instituteId) {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    const stats = await dashboardRepository.getAdminStats(instituteId, today, monthStart);
    const recentPayments = await dashboardRepository.getRecentPayments(instituteId);
    const recentMembers = await dashboardRepository.getRecentMembers(instituteId);
    const monthlyCollection = await dashboardRepository.getMonthlyCollection(instituteId);
    const attendanceTrend = await dashboardRepository.getAttendanceTrend(instituteId);
    const feeBreakdown = await dashboardRepository.getFeeBreakdown(instituteId);

    return {
      stats,
      recentPayments,
      recentMembers,
      charts: {
        monthlyCollection,
        attendanceTrend,
        feeBreakdown
      }
    };
  }

  async getStaffDashboard(instituteId, userId) {
    const today = new Date().toISOString().slice(0, 10);
    const sp = await dashboardRepository.getStaffProfileByUserId(userId);
    if (!sp) {
      return { stats: {}, groups: [] };
    }

    const assignedGroups = await dashboardRepository.getAssignedGroupsForStaff(sp.id);
    const groupIds = assignedGroups.map(g => g.id);

    const todaySessions = await dashboardRepository.getStaffTodaySessions(groupIds, today);
    const recentAttendance = await dashboardRepository.getStaffRecentAttendance(groupIds);
    const membersCount = await dashboardRepository.getStaffMembersCount(groupIds);

    return {
      stats: {
        assignedGroupsCount: assignedGroups.length,
        membersCount,
        todaySessionsCount: todaySessions.length
      },
      assignedGroups,
      todaySessions,
      recentAttendance
    };
  }
}

module.exports = new DashboardService();
