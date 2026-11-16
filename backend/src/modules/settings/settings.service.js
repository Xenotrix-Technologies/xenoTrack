const settingsRepository = require('./settings.repository');
const activityLogger = require('../../core/utils/activityLogger');

class SettingsService {
  async getSettings(instituteId) {
    const institute = await settingsRepository.getInstitute(instituteId);
    const settings = await settingsRepository.getSettings(instituteId);
    return { institute, settings };
  }

  async updateSettings({ instituteId, userId, body, ipAddress }) {
    const conn = await settingsRepository.getConnection();
    try {
      await conn.beginTransaction();
      const { institute, settings } = body;

      if (institute) {
        const { name, address, phone, email, timezone, currency } = institute;
        await conn.query(
          'UPDATE institutes SET name=?, address=?, phone=?, email=?, timezone=?, currency=? WHERE id=?',
          [name, address || null, phone || null, email || null, timezone || 'Asia/Kolkata', currency || 'INR', instituteId]
        );
      }

      if (settings) {
        for (const [key, value] of Object.entries(settings)) {
          await conn.query(
            `INSERT INTO institute_settings (institute_id, setting_key, setting_value, updated_by)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (institute_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_by = EXCLUDED.updated_by`,
            [instituteId, key, value, userId]
          );
        }
      }

      await conn.commit();
      await activityLogger.log(instituteId, userId, 'UPDATE_SETTINGS', 'institute', instituteId, null, body, ipAddress);
      return { success: true, message: 'Settings updated successfully' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getActivityLogs({ instituteId, userId, action, entityType, fromDate, toDate, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const { logs, total } = await settingsRepository.getActivityLogs({
      instituteId,
      userId,
      action,
      entityType,
      fromDate,
      toDate,
      limit,
      offset
    });

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getGenderOptions(instituteId, status) {
    return settingsRepository.getGenderOptions(instituteId, status);
  }

  async createGenderOption({ instituteId, userId, name, status, ipAddress }) {
    if (!name || !name.trim()) {
      const err = new Error('Gender option name is required');
      err.status = 400;
      throw err;
    }
    const cleanName = name.trim();
    const cleanStatus = status === 'inactive' ? 'inactive' : 'active';

    const existing = await settingsRepository.findGenderOptionByName(instituteId, cleanName);
    if (existing) {
      const err = new Error(`Gender option "${cleanName}" already exists`);
      err.status = 409;
      throw err;
    }

    const nextOrder = await settingsRepository.getNextGenderDisplayOrder(instituteId);
    const created = await settingsRepository.createGenderOption(instituteId, cleanName, cleanStatus, nextOrder);

    await activityLogger.log(
      instituteId,
      userId,
      'CREATE_GENDER_OPTION',
      'gender_option',
      created.id,
      null,
      { name: cleanName, status: cleanStatus },
      ipAddress
    );

    return created;
  }

  async updateGenderOption({ id, instituteId, userId, data, ipAddress }) {
    let { name, status, display_order } = data;
    const oldOption = await settingsRepository.findGenderOptionById(id, instituteId);
    if (!oldOption) {
      const err = new Error('Gender option not found');
      err.status = 404;
      throw err;
    }

    let finalName = oldOption.name;
    if (name !== undefined) {
      if (!name || !name.trim()) {
        const err = new Error('Gender option name cannot be empty');
        err.status = 400;
        throw err;
      }
      finalName = name.trim();
      const duplicate = await settingsRepository.findGenderOptionByName(instituteId, finalName, id);
      if (duplicate) {
        const err = new Error(`Gender option "${finalName}" already exists`);
        err.status = 409;
        throw err;
      }
    }

    const newStatus = status ? (status === 'inactive' ? 'inactive' : 'active') : oldOption.status;
    const newOrder = display_order !== undefined ? parseInt(display_order, 10) : oldOption.display_order;

    const updated = await settingsRepository.updateGenderOption(id, instituteId, finalName, newStatus, newOrder);
    await activityLogger.log(
      instituteId,
      userId,
      'UPDATE_GENDER_OPTION',
      'gender_option',
      id,
      oldOption,
      { name: finalName, status: newStatus },
      ipAddress
    );

    return updated;
  }

  async toggleGenderOptionStatus({ id, instituteId, userId, status, ipAddress }) {
    const opt = await settingsRepository.findGenderOptionById(id, instituteId);
    if (!opt) {
      const err = new Error('Gender option not found');
      err.status = 404;
      throw err;
    }

    const nextStatus = status ? (status === 'active' ? 'active' : 'inactive') : (opt.status === 'active' ? 'inactive' : 'active');
    const updated = await settingsRepository.toggleGenderOptionStatus(id, instituteId, nextStatus);

    await activityLogger.log(
      instituteId,
      userId,
      'TOGGLE_GENDER_OPTION_STATUS',
      'gender_option',
      id,
      { status: opt.status },
      { status: nextStatus },
      ipAddress
    );

    return { updated, nextStatus };
  }

  async deleteGenderOption({ id, instituteId, userId, ipAddress }) {
    const opt = await settingsRepository.findGenderOptionById(id, instituteId);
    if (!opt) {
      const err = new Error('Gender option not found');
      err.status = 404;
      throw err;
    }

    const memberCount = await settingsRepository.countMembersWithGender(instituteId, opt.name);
    if (memberCount > 0) {
      const err = new Error(
        `Cannot delete "${opt.name}" because ${memberCount} member(s) are currently assigned to it. Please reassign them or disable this option instead.`
      );
      err.status = 409;
      throw err;
    }

    await settingsRepository.deleteGenderOption(id, instituteId);
    await activityLogger.log(instituteId, userId, 'DELETE_GENDER_OPTION', 'gender_option', id, opt, null, ipAddress);
    return { success: true, message: 'Gender option deleted successfully' };
  }

  async reorderGenderOptions({ instituteId, userId, items, ipAddress }) {
    const conn = await settingsRepository.getConnection();
    try {
      await conn.beginTransaction();

      if (Array.isArray(items)) {
        for (const item of items) {
          await conn.query(
            'UPDATE gender_options SET display_order = ?, updated_at = NOW() WHERE id = ? AND institute_id = ?',
            [parseInt(item.display_order, 10), item.id, instituteId]
          );
        }
      }

      await conn.commit();
      await activityLogger.log(instituteId, userId, 'REORDER_GENDER_OPTIONS', 'gender_option', null, null, { items }, ipAddress);
      return settingsRepository.getGenderOptions(instituteId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new SettingsService();
