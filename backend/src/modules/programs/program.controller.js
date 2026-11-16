const programService = require('./program.service');

class ProgramController {
  async list(req, res, next) {
    try {
      const programs = await programService.list(req.user.institute_id, req.query.status);
      res.json({ success: true, data: programs });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const program = await programService.getById(req.params.id, req.user.institute_id);
      res.json({ success: true, data: program });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await programService.create({
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
      const data = await programService.update({
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

module.exports = new ProgramController();
