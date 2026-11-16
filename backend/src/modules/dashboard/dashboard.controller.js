const dashboardService = require('./dashboard.service');

class DashboardController {
  async getAdminDashboard(req, res, next) {
    try {
      const data = await dashboardService.getAdminDashboard(req.user.institute_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStaffDashboard(req, res, next) {
    try {
      const data = await dashboardService.getStaffDashboard(req.user.institute_id, req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
