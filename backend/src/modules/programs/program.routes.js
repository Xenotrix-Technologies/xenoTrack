const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const programController = require('./program.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res, next) => programController.list(req, res, next));
router.get('/:id', (req, res, next) => programController.getById(req, res, next));
router.post(
  '/',
  requireRole('admin'),
  [body('name').trim().notEmpty()],
  validate,
  (req, res, next) => programController.create(req, res, next)
);
router.put(
  '/:id',
  requireRole('admin'),
  [body('name').trim().notEmpty()],
  validate,
  (req, res, next) => programController.update(req, res, next)
);

module.exports = router;
