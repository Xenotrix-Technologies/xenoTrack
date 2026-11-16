const bcrypt = require('bcryptjs');
const staffRepository = require('./staff.repository');
const activityLogger = require('../../core/utils/activityLogger');
const { generateCode } = require('../../core/utils/helpers');

class StaffService {
  async list({ instituteId, status, search }) {
    return staffRepository.findAll({ instituteId, status, search });
  }

  async getById(id, instituteId) {
    const staff = await staffRepository.findById(id, instituteId);
    if (!staff) {
      const err = new Error('Staff not found');
      err.status = 404;
      throw err;
    }

    const groups = await staffRepository.getStaffGroups(id);
    return { ...staff, groups };
  }

  async create({ instituteId, adminId, data, ipAddress }) {
    const { full_name, email, phone, password, designation, joining_date, can_collect_fees, can_edit_attendance } = data;

    const existing = await staffRepository.findUserByEmailAndInstitute(email, instituteId);
    if (existing) {
      const err = new Error('Email already in use');
      err.status = 409;
      throw err;
    }

    const userId = await staffRepository.createUser(instituteId, email, password, full_name, phone);

    const maxId = await staffRepository.getMaxStaffId(instituteId);
    const prefix = await staffRepository.getStaffCodePrefix(instituteId);
    const staffCode = generateCode(prefix, maxId + 1);

    const profileId = await staffRepository.createProfile({
      user_id: userId,
      institute_id: instituteId,
      staff_code: staffCode,
      designation,
      joining_date,
      can_collect_fees,
      can_edit_attendance
    });

    await activityLogger.log(instituteId, adminId, 'CREATE_STAFF', 'staff_profile', profileId, null, { full_name, email }, ipAddress);
    return staffRepository.findById(profileId, instituteId);
  }

  async update({ id, instituteId, adminId, data, ipAddress }) {
    const staff = await staffRepository.findById(id, instituteId);
    if (!staff) {
      const err = new Error('Staff not found');
      err.status = 404;
      throw err;
    }

    await staffRepository.update(id, staff.user_id, data);
    await activityLogger.log(instituteId, adminId, 'UPDATE_STAFF', 'staff_profile', id, staff, data, ipAddress);
    return staffRepository.findById(id, instituteId);
  }

  async resetPassword({ id, instituteId, adminId, newPassword, ipAddress }) {
    const staff = await staffRepository.findById(id, instituteId);
    if (!staff) {
      const err = new Error('Staff not found');
      err.status = 404;
      throw err;
    }

    await staffRepository.updatePassword(staff.user_id, newPassword);
    await activityLogger.log(instituteId, adminId, 'RESET_STAFF_PASSWORD', 'staff_profile', id, null, null, ipAddress);
    return { success: true, message: 'Password reset successfully' };
  }
}

module.exports = new StaffService();
