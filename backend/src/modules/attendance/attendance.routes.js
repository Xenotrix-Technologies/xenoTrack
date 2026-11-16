const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const attendanceController = require('./attendance.controller');

const router = express.Router();
router.use(authenticate);

router.get('/sessions', (req, res, next) => attendanceController.listSessions(req, res, next));
router.post(
  '/sessions',
  [body('group_id').isInt(), body('session_date').isDate()],
  validate,
  (req, res, next) => attendanceController.createSession(req, res, next)
);
router.get('/sessions/:session_id/records', (req, res, next) => attendanceController.getSessionRecords(req, res, next));
router.post(
  '/records/bulk',
  [body('session_id').isInt(), body('records').isArray()],
  validate,
  (req, res, next) => attendanceController.saveBulkAttendance(req, res, next)
);
router.put(
  '/records/:id',
  [body('status').isIn(['present', 'absent', 'late', 'excused'])],
  validate,
  (req, res, next) => attendanceController.updateRecord(req, res, next)
);

module.exports = router;
