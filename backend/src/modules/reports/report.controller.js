const reportService = require('./report.service');

class ReportController {
  async getAttendanceReport(req, res, next) {
    try {
      const { from_date, to_date, group_id, program_id, member_id, report_type } = req.query;
      const data = await reportService.getAttendanceReport({
        instituteId: req.user.institute_id,
        fromDate: from_date,
        toDate: to_date,
        groupId: group_id,
        programId: program_id,
        memberId: member_id,
        reportType: report_type || 'summary'
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCollectionReport(req, res, next) {
    try {
      const { from_date, to_date, group_id, program_id, staff_id, payment_method } = req.query;
      const data = await reportService.getCollectionReport({
        instituteId: req.user.institute_id,
        fromDate: from_date,
        toDate: to_date,
        groupId: group_id,
        programId: program_id,
        staffId: staff_id,
        paymentMethod: payment_method
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getOutstandingReport(req, res, next) {
    try {
      const { status, program_id, group_id } = req.query;
      const data = await reportService.getOutstandingReport({
        instituteId: req.user.institute_id,
        status,
        programId: program_id,
        groupId: group_id
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
