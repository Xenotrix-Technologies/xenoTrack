const bcrypt = require('bcryptjs');
const authRepository = require('./auth.repository');
const { signAccess, signRefresh, verifyRefresh, hashToken, refreshExpiresAt } = require('../../core/config/jwt');
const activityLogger = require('../../core/utils/activityLogger');

class AuthService {
  async login({ email, password, ipAddress }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('Account is deactivated');
      err.status = 401;
      throw err;
    }

    const isBcrypt = user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$'));
    const match = user.password_hash === password || (isBcrypt ? await bcrypt.compare(password, user.password_hash).catch(() => false) : false);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const payload = { userId: user.id, instituteId: user.institute_id, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    await authRepository.saveRefreshToken(user.id, hashToken(refreshToken), refreshExpiresAt());
    await authRepository.updateLastLogin(user.id);
    await activityLogger.log(user.institute_id, user.id, 'LOGIN', 'user', user.id, null, null, ipAddress);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        instituteId: user.institute_id,
        canCollectFees: user.can_collect_fees,
        canEditAttendance: user.can_edit_attendance,
      }
    };
  }

  async refreshToken(token) {
    if (!token) {
      const err = new Error('Refresh token required');
      err.status = 401;
      throw err;
    }

    let decoded;
    try {
      decoded = verifyRefresh(token);
    } catch {
      const err = new Error('Invalid or expired refresh token');
      err.status = 401;
      throw err;
    }

    const tokenHash = hashToken(token);
    const existing = await authRepository.findValidRefreshToken(tokenHash);
    if (!existing) {
      const err = new Error('Refresh token not found or expired');
      err.status = 401;
      throw err;
    }

    // Rotate token
    await authRepository.deleteRefreshToken(tokenHash);

    const user = await authRepository.findById(decoded.userId);
    if (!user || !user.is_active) {
      const err = new Error('User not found or deactivated');
      err.status = 401;
      throw err;
    }

    const payload = { userId: user.id, instituteId: user.institute_id, role: user.role };
    const newAccess = signAccess(payload);
    const newRefresh = signRefresh(payload);

    await authRepository.saveRefreshToken(user.id, hashToken(newRefresh), refreshExpiresAt());

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await authRepository.deleteRefreshToken(hashToken(refreshToken));
    }
    return { success: true, message: 'Logged out' };
  }

  async getMe(user) {
    let staffData = {};
    if (user.role === 'staff') {
      const sp = await authRepository.getStaffProfile(user.id);
      if (sp) {
        staffData = {
          canCollectFees: sp.can_collect_fees,
          canEditAttendance: sp.can_edit_attendance,
          staffProfileId: sp.id
        };
      }
    }
    return { ...user, ...staffData };
  }

  async changePassword({ userId, instituteId, currentPassword, newPassword, ipAddress }) {
    const currentHash = await authRepository.getPasswordHash(userId);
    const isBcrypt = currentHash && (currentHash.startsWith('$2a$') || currentHash.startsWith('$2b$'));
    const match = currentHash === currentPassword || (isBcrypt ? await bcrypt.compare(currentPassword, currentHash || '').catch(() => false) : false);
    if (!match) {
      const err = new Error('Current password is incorrect');
      err.status = 400;
      throw err;
    }

    await authRepository.updatePassword(userId, newPassword);
    await authRepository.deleteRefreshTokensByUserId(userId);
    await activityLogger.log(instituteId, userId, 'CHANGE_PASSWORD', 'user', userId, null, null, ipAddress);

    return { success: true, message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
