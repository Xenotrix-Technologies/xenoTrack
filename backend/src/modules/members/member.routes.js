const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const memberController = require('./member.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res, next) => memberController.list(req, res, next));
router.get('/:id', (req, res, next) => memberController.getById(req, res, next));

router.post(
  '/',
  requireRole('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional({ checkFalsy: true }).customSanitizer(v => typeof v === 'string' ? v.replace(/[\s-]/g, '') : v).isMobilePhone('any').withMessage('Invalid phone number'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('dob').optional({ checkFalsy: true }).isDate(),
  ],
  validate,
  (req, res, next) => memberController.create(req, res, next)
);

router.put(
  '/:id',
  requireRole('admin'),
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional({ checkFalsy: true }).customSanitizer(v => typeof v === 'string' ? v.replace(/[\s-]/g, '') : v).isMobilePhone('any').withMessage('Invalid phone number'),
    body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
    body('dob').optional({ checkFalsy: true }).isDate(),
  ],
  validate,
  (req, res, next) => memberController.update(req, res, next)
);

router.patch(
  '/:id/status',
  requireRole('admin'),
  [body('status').isIn(['active', 'inactive', 'suspended', 'completed'])],
  validate,
  (req, res, next) => memberController.updateStatus(req, res, next)
);

module.exports = router;
