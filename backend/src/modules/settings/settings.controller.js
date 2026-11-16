const settingsService = require('./settings.service');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const data = await settingsService.getSettings(req.user.institute_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const result = await settingsService.updateSettings({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        body: req.body,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getActivityLogs(req, res, next) {
    try {
      const { user_id, action, entity_type, from_date, to_date, page, limit } = req.query;
      const { logs, pagination } = await settingsService.getActivityLogs({
        instituteId: req.user.institute_id,
        userId: user_id,
        action,
        entityType: entity_type,
        fromDate: from_date,
        toDate: to_date,
        page,
        limit
      });
      res.json({ success: true, data: logs, pagination });
    } catch (err) {
      next(err);
    }
  }

  async getGenderOptions(req, res, next) {
    try {
      const options = await settingsService.getGenderOptions(req.user.institute_id, req.query.status);
      res.json({ success: true, data: options });
    } catch (err) {
      next(err);
    }
  }

  async createGenderOption(req, res, next) {
    try {
      const created = await settingsService.createGenderOption({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        name: req.body.name,
        status: req.body.status,
        ipAddress: req.ip
      });
      res.status(201).json({ success: true, data: created, message: 'Gender option created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateGenderOption(req, res, next) {
    try {
      const updated = await settingsService.updateGenderOption({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        data: req.body,
        ipAddress: req.ip
      });
      res.json({ success: true, data: updated, message: 'Gender option updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async toggleGenderOptionStatus(req, res, next) {
    try {
      const { updated, nextStatus } = await settingsService.toggleGenderOptionStatus({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        status: req.body.status,
        ipAddress: req.ip
      });
      res.json({ success: true, data: updated, message: `Gender option is now ${nextStatus}` });
    } catch (err) {
      next(err);
    }
  }

  async deleteGenderOption(req, res, next) {
    try {
      const result = await settingsService.deleteGenderOption({
        id: req.params.id,
        instituteId: req.user.institute_id,
        userId: req.user.id,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async reorderGenderOptions(req, res, next) {
    try {
      const options = await settingsService.reorderGenderOptions({
        instituteId: req.user.institute_id,
        userId: req.user.id,
        items: req.body.items,
        ipAddress: req.ip
      });
      res.json({ success: true, data: options, message: 'Gender options reordered successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
