const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validate } = require('../../core/middleware/validate');
const { authenticate } = require('../../core/middleware/auth');
const authController = require('./auth.controller');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later' }
});

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6 })
  ],
  validate,
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  (req, res, next) => authController.refreshToken(req, res, next)
);

router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  validate,
  (req, res, next) => authController.changePassword(req, res, next)
);

module.exports = router;
