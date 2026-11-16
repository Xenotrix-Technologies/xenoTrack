const feeService = require('./fee.service');

class FeeController {
  async listPlans(req, res, next) {
    try {
      const plans = await feeService.listPlans(req.user.institute_id, req.query.status);
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  async createPlan(req, res, next) {
    try {
      const data = await feeService.createPlan({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req, res, next) {
    try {
      const data = await feeService.updatePlan({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const { member_id, status, from_date, to_date, page, limit } = req.query;
      const { records, pagination } = await feeService.listRecords({
        instituteId: req.user.institute_id,
        memberId: member_id,
        status,
        fromDate: from_date,
        toDate: to_date,
        page,
        limit
      });
      res.json({ success: true, data: records, pagination });
    } catch (err) {
      next(err);
    }
  }

  async createRecord(req, res, next) {
    try {
      const data = await feeService.createRecord({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const data = await feeService.updateRecord({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeeController();
