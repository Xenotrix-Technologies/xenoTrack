const staffService = require('./staff.service');

class StaffController {
  async list(req, res, next) {
    try {
      const { status, search } = req.query;
      const staff = await staffService.list({
        instituteId: req.user.institute_id,
        status,
        search
      });
      res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const staff = await staffService.getById(req.params.id, req.user.institute_id);
      res.json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await staffService.create({
        instituteId: req.user.institute_id,
        adminId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data, message: 'Staff created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await staffService.update({
        id: req.params.id,
        instituteId: req.user.institute_id,
        adminId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await staffService.resetPassword({
        id: req.params.id,
        instituteId: req.user.institute_id,
        adminId: req.user.id,
        newPassword: req.body.new_password,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StaffController();
