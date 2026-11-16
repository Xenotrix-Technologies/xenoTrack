const programRepository = require('./program.repository');
const activityLogger = require('../../core/utils/activityLogger');

class ProgramService {
  async list(instituteId, status) {
    return programRepository.findAll(instituteId, status);
  }

  async getById(id, instituteId) {
    const program = await programRepository.findById(id, instituteId);
    if (!program) {
      const err = new Error('Program not found');
      err.status = 404;
      throw err;
    }
    return program;
  }

  async create({ instituteId, userId, data, ipAddress }) {
    const insertId = await programRepository.create({
      ...data,
      institute_id: instituteId
    });

    await activityLogger.log(instituteId, userId, 'CREATE_PROGRAM', 'program', insertId, null, data, ipAddress);
    return programRepository.findById(insertId, instituteId);
  }

  async update({ id, instituteId, userId, data, ipAddress }) {
    const existing = await programRepository.findById(id, instituteId);
    if (!existing) {
      const err = new Error('Program not found');
      err.status = 404;
      throw err;
    }

    await programRepository.update(id, instituteId, data);
    await activityLogger.log(instituteId, userId, 'UPDATE_PROGRAM', 'program', id, existing, data, ipAddress);
    return programRepository.findById(id, instituteId);
  }
}

module.exports = new ProgramService();
