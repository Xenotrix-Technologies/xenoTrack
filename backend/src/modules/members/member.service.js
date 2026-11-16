const memberRepository = require('./member.repository');
const activityLogger = require('../../core/utils/activityLogger');
const { generateCode } = require('../../core/utils/helpers');

class MemberService {
  async list({ instituteId, search, status, programId, groupId, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { members, total } = await memberRepository.findAndCountAll({
      instituteId,
      search,
      status,
      programId,
      groupId,
      limit,
      offset
    });

    return {
      members,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id, instituteId) {
    const member = await memberRepository.findById(id, instituteId);
    if (!member) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }

    const details = await memberRepository.getMemberDetails(id);
    return { ...member, ...details };
  }

  async create({ instituteId, userId, data, ipAddress }) {
    const maxId = await memberRepository.getMaxId(instituteId);
    const prefix = await memberRepository.getMemberCodePrefix(instituteId);
    const memberCode = generateCode(prefix, maxId + 1);

    const insertId = await memberRepository.create({
      ...data,
      institute_id: instituteId,
      member_code: memberCode,
      userId
    });

    await activityLogger.log(
      instituteId,
      userId,
      'CREATE_MEMBER',
      'member',
      insertId,
      null,
      { full_name: data.full_name, memberCode },
      ipAddress
    );

    return memberRepository.findById(insertId, instituteId);
  }

  async update({ id, instituteId, userId, data, ipAddress }) {
    const existing = await memberRepository.findById(id, instituteId);
    if (!existing) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }

    await memberRepository.update(id, data);
    await activityLogger.log(instituteId, userId, 'UPDATE_MEMBER', 'member', id, existing, data, ipAddress);

    return memberRepository.findById(id, instituteId);
  }

  async updateStatus({ id, instituteId, userId, status, ipAddress }) {
    const valid = ['active', 'inactive', 'suspended', 'completed'];
    if (!valid.includes(status)) {
      const err = new Error('Invalid status');
      err.status = 400;
      throw err;
    }

    const existing = await memberRepository.findById(id, instituteId);
    if (!existing) {
      const err = new Error('Member not found');
      err.status = 404;
      throw err;
    }

    await memberRepository.updateStatus(id, status);
    await activityLogger.log(
      instituteId,
      userId,
      'UPDATE_MEMBER_STATUS',
      'member',
      id,
      { status: existing.status },
      { status },
      ipAddress
    );

    return { success: true, message: `Member status updated to ${status}` };
  }
}

module.exports = new MemberService();
