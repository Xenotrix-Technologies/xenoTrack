const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const groupController = require('./group.controller');

const router = express.Router();
router.use(authenticate);

// Groups
router.get('/', (req, res, next) => groupController.list(req, res, next));
router.get('/:id', (req, res, next) => groupController.getById(req, res, next));

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').trim().notEmpty(),
    body('program_id').isInt()
  ],
  validate,
  (req, res, next) => groupController.create(req, res, next)
);

router.put('/:id', requireRole('admin'), (req, res, next) => groupController.update(req, res, next));

router.post(
  '/:id/staff',
  requireRole('admin'),
  [body('staff_profile_id').isInt()],
  validate,
  (req, res, next) => groupController.assignStaff(req, res, next)
);

router.delete('/:id/staff/:staffId', requireRole('admin'), (req, res, next) => groupController.removeStaff(req, res, next));

module.exports = router;
