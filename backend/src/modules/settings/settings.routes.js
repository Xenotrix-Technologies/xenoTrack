const express = require('express');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const settingsController = require('./settings.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res, next) => settingsController.getSettings(req, res, next));
router.put('/', requireRole('admin'), (req, res, next) => settingsController.updateSettings(req, res, next));
router.get('/activity-logs', requireRole('admin'), (req, res, next) => settingsController.getActivityLogs(req, res, next));

// Gender Options (accessible to all authenticated users for dropdowns, managed by admin)
router.get('/gender-options', (req, res, next) => settingsController.getGenderOptions(req, res, next));
router.post('/gender-options', requireRole('admin'), (req, res, next) => settingsController.createGenderOption(req, res, next));
router.put('/gender-options/reorder', requireRole('admin'), (req, res, next) => settingsController.reorderGenderOptions(req, res, next));
router.put('/gender-options/:id', requireRole('admin'), (req, res, next) => settingsController.updateGenderOption(req, res, next));
router.patch('/gender-options/:id/status', requireRole('admin'), (req, res, next) => settingsController.toggleGenderOptionStatus(req, res, next));
router.delete('/gender-options/:id', requireRole('admin'), (req, res, next) => settingsController.deleteGenderOption(req, res, next));

module.exports = router;
