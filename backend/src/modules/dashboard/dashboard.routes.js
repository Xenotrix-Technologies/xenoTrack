const express = require('express');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const dashboardController = require('./dashboard.controller');

const router = express.Router();

router.use(authenticate);
router.get('/admin', requireRole('admin'), (req, res, next) => dashboardController.getAdminDashboard(req, res, next));
router.get('/staff', requireRole('staff', 'admin'), (req, res, next) => dashboardController.getStaffDashboard(req, res, next));

module.exports = router;
