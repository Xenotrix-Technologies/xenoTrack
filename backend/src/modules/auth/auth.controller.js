const authService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login({ email, password, ipAddress: req.ip });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const data = await authService.refreshToken(refreshToken);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const data = await authService.getMe(req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword({
        userId: req.user.id,
        instituteId: req.user.institute_id,
        currentPassword,
        newPassword,
        ipAddress: req.ip
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
