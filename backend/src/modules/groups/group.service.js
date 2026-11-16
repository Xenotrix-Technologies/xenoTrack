const groupRepository = require('./group.repository');
const activityLogger = require('../../core/utils/activityLogger');

class GroupService {
  async list({ instituteId, programId, status, staffId }) {
    return groupRepository.findAll({ instituteId, programId, status, staffId });
  }

  async getById(id, instituteId) {
    const group = await groupRepository.findById(id, instituteId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const staff = await groupRepository.getGroupStaff(id);
    const members = await groupRepository.getGroupMembers(id);
    return { ...group, staff, members };
  }

  async create({ instituteId, userId, data, ipAddress }) {
    const scheduled_days = typeof data.scheduled_days === 'string'
      ? data.scheduled_days
      : JSON.stringify(data.scheduled_days || []);

    const insertId = await groupRepository.create({
      ...data,
      scheduled_days,
      institute_id: instituteId
    });

    await activityLogger.log(instituteId, userId, 'CREATE_GROUP', 'group', insertId, null, data, ipAddress);
    return groupRepository.findById(insertId, instituteId);
  }

  async update({ id, instituteId, userId, data, ipAddress }) {
    const existing = await groupRepository.findById(id, instituteId);
    if (!existing) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const scheduled_days = typeof data.scheduled_days === 'string'
      ? data.scheduled_days
      : JSON.stringify(data.scheduled_days || []);

    await groupRepository.update(id, instituteId, { ...data, scheduled_days });
    await activityLogger.log(instituteId, userId, 'UPDATE_GROUP', 'group', id, existing, data, ipAddress);
    return groupRepository.findById(id, instituteId);
  }

  async assignStaff({ groupId, instituteId, staffProfileId, isPrimary }) {
    const group = await groupRepository.findById(groupId, instituteId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    await groupRepository.assignStaff(groupId, staffProfileId, isPrimary);
    return { success: true, message: 'Staff assigned to group' };
  }

  async removeStaff({ groupId, staffId, instituteId }) {
    const group = await groupRepository.findById(groupId, instituteId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    await groupRepository.removeStaff(groupId, staffId);
    return { success: true, message: 'Staff removed from group' };
  }

  async enroll({ instituteId, userId, data, ipAddress }) {
    const { member_id, program_id, group_id, fee_plan_id, notes } = data;
    const existing = await groupRepository.findExistingEnrollment(member_id, program_id, group_id);
    if (existing) {
      const err = new Error('Member already enrolled in this program/group');
      err.status = 409;
      throw err;
    }

    const insertId = await groupRepository.createEnrollment({
      institute_id: instituteId,
      member_id,
      program_id,
      group_id,
      fee_plan_id,
      notes
    });

    await activityLogger.log(instituteId, userId, 'ENROLL_MEMBER', 'enrollment', insertId, null, data, ipAddress);
    return { success: true, message: 'Member enrolled successfully' };
  }

  async updateEnrollment({ id, instituteId, data }) {
    await groupRepository.updateEnrollment(id, instituteId, data);
    return { success: true, message: 'Enrollment updated' };
  }
}

module.exports = new GroupService();
