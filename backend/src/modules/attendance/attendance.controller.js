const attendanceService = require('./attendance.service');

class AttendanceController {
  async listSessions(req, res, next) {
    try {
      const { group_id, from_date, to_date, page, limit } = req.query;
      const { sessions, pagination } = await attendanceService.listSessions({
        instituteId: req.user.institute_id,
        groupId: group_id,
        fromDate: from_date,
        toDate: to_date,
        userRole: req.user.role,
        userId: req.user.id,
        page,
        limit
      });
      res.json({ success: true, data: sessions, pagination });
    } catch (err) {
      next(err);
    }
  }

  async createSession(req, res, next) {
    try {
      const data = await attendanceService.createSession({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSessionRecords(req, res, next) {
    try {
      const data = await attendanceService.getSessionRecords({
        sessionId: req.params.session_id,
        instituteId: req.user.institute_id
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async saveBulkAttendance(req, res, next) {
    try {
      const result = await attendanceService.saveBulkAttendance({
        sessionId: req.body.session_id,
        records: req.body.records,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const result = await attendanceService.updateRecord({
        id: req.params.id,
        instituteId: req.user.institute_id,
        user: req.user,
        data: req.body,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
