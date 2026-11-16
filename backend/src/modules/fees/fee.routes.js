const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireRole } = require('../../core/middleware/auth');
const { validate } = require('../../core/middleware/validate');
const feeController = require('./fee.controller');
const paymentRoutes = require('../payments/payment.routes');

const router = express.Router();
router.use(authenticate);

// Fee Plans
router.get('/plans', (req, res, next) => feeController.listPlans(req, res, next));
router.post(
  '/plans',
  requireRole('admin'),
  [
    body('name').trim().notEmpty(),
    body('amount').isFloat({ min: 0 })
  ],
  validate,
  (req, res, next) => feeController.createPlan(req, res, next)
);
router.put('/plans/:id', requireRole('admin'), (req, res, next) => feeController.updatePlan(req, res, next));

// Fee Records
router.get('/records', (req, res, next) => feeController.listRecords(req, res, next));
router.post(
  '/records',
  requireRole('admin'),
  [
    body('member_id').isInt(),
    body('original_amount').isFloat({ min: 0 })
  ],
  validate,
  (req, res, next) => feeController.createRecord(req, res, next)
);
router.put('/records/:id', requireRole('admin'), (req, res, next) => feeController.updateRecord(req, res, next));

// Payments (nested under /fees/payments for API compatibility)
router.use('/payments', paymentRoutes);

module.exports = router;
