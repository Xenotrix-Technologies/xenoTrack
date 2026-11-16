const memberService = require('./member.service');

class MemberController {
  async list(req, res, next) {
    try {
      const { search, status, program_id, group_id, page, limit } = req.query;
      const { members, pagination } = await memberService.list({
        instituteId: req.user.institute_id,
        search,
        status,
        programId: program_id,
        groupId: group_id,
        page,
        limit
      });
      res.json({ success: true, data: members, pagination });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await memberService.getById(req.params.id, req.user.institute_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await memberService.create({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data, message: 'Member created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await memberService.update({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.json({ success: true, data, message: 'Member updated' });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await memberService.updateStatus({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        status: req.body.status,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MemberController();
