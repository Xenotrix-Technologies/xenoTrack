const express = require('express');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const reportController = require('./report.controller');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/attendance', (req, res, next) => reportController.getAttendanceReport(req, res, next));
router.get('/collections', (req, res, next) => reportController.getCollectionReport(req, res, next));
router.get('/outstanding-fees', (req, res, next) => reportController.getOutstandingReport(req, res, next));

module.exports = router;
