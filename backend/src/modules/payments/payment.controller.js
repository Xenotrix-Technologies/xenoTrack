const paymentService = require('./payment.service');

class PaymentController {
  async list(req, res, next) {
    try {
      const { member_id, from_date, to_date, payment_method, collected_by, page, limit } = req.query;
      const { payments, pagination } = await paymentService.list({
        instituteId: req.user.institute_id,
        memberId: member_id,
        fromDate: from_date,
        toDate: to_date,
        paymentMethod: payment_method,
        collectedBy: collected_by,
        page,
        limit
      });
      res.json({ success: true, data: payments, pagination });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await paymentService.recordPayment({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data, message: 'Payment recorded successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getReceipt(req, res, next) {
    try {
      const data = await paymentService.getReceipt(req.params.id, req.user.institute_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async reverse(req, res, next) {
    try {
      const result = await paymentService.reversePayment({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        reason: req.body.reason,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PaymentController();
