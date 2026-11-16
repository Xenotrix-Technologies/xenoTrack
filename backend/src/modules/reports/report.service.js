const reportRepository = require('./report.repository');

class ReportService {
  async getAttendanceReport({ instituteId, fromDate, toDate, groupId, programId, memberId, reportType }) {
    return reportRepository.getAttendanceReport({
      instituteId,
      fromDate,
      toDate,
      groupId,
      programId,
      memberId,
      reportType
    });
  }

  async getCollectionReport({ instituteId, fromDate, toDate, groupId, programId, staffId, paymentMethod }) {
    return reportRepository.getCollectionReport({
      instituteId,
      fromDate,
      toDate,
      groupId,
      programId,
      staffId,
      paymentMethod
    });
  }

  async getOutstandingReport({ instituteId, status, programId, groupId }) {
    return reportRepository.getOutstandingReport({
      instituteId,
      status,
      programId,
      groupId
    });
  }
}

module.exports = new ReportService();
