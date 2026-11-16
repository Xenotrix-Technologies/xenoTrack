const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const groupController = require('./group.controller');

const router = express.Router();
router.use(authenticate);

router.post(
  '/',
  requireRole('admin'),
  [
    body('member_id').isInt(),
    body('program_id').isInt()
  ],
  validate,
  (req, res, next) => groupController.enroll(req, res, next)
);

router.put('/:id', requireRole('admin'), (req, res, next) => groupController.updateEnrollment(req, res, next));

module.exports = router;
