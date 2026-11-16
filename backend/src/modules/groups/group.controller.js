const groupService = require('./group.service');

class GroupController {
  async list(req, res, next) {
    try {
      const { program_id, status, staff_id } = req.query;
      const groups = await groupService.list({
        instituteId: req.user.institute_id,
        programId: program_id,
        status,
        staffId: staff_id
      });
      res.json({ success: true, data: groups });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const group = await groupService.getById(req.params.id, req.user.institute_id);
      res.json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await groupService.create({
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

  async update(req, res, next) {
    try {
      const data = await groupService.update({
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

  async assignStaff(req, res, next) {
    try {
      const result = await groupService.assignStaff({
        groupId: req.params.id,
        instituteId: req.user.institute_id,
        staffProfileId: req.body.staff_profile_id,
        isPrimary: req.body.is_primary
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async removeStaff(req, res, next) {
    try {
      const result = await groupService.removeStaff({
        groupId: req.params.id,
        staffId: req.params.staffId,
        instituteId: req.user.institute_id
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async enroll(req, res, next) {
    try {
      const result = await groupService.enroll({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateEnrollment(req, res, next) {
    try {
      const result = await groupService.updateEnrollment({
        id: req.params.id,
        instituteId: req.user.institute_id,
        data: req.body
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GroupController();
