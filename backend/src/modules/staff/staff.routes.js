const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const staffController = require('./staff.controller');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

router.get('/', (req, res, next) => staffController.list(req, res, next));
router.get('/:id', (req, res, next) => staffController.getById(req, res, next));

router.post(
  '/',
  [
    body('full_name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  validate,
  (req, res, next) => staffController.create(req, res, next)
);

router.put(
  '/:id',
  [body('full_name').trim().notEmpty()],
  validate,
  (req, res, next) => staffController.update(req, res, next)
);

router.post(
  '/:id/reset-password',
  [body('new_password').isLength({ min: 6 })],
  validate,
  (req, res, next) => staffController.resetPassword(req, res, next)
);

module.exports = router;
