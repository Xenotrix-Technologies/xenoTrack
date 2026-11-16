const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const paymentController = require('./payment.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res, next) => paymentController.list(req, res, next));

router.post(
  '/',
  [
    body('fee_record_id').isInt(),
    body('amount').isFloat({ min: 0.01 })
  ],
  validate,
  (req, res, next) => paymentController.create(req, res, next)
);

router.get('/:id/receipt', (req, res, next) => paymentController.getReceipt(req, res, next));
router.post('/:id/reverse', requireRole('admin'), (req, res, next) => paymentController.reverse(req, res, next));

module.exports = router;
