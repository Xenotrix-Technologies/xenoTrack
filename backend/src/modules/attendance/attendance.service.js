const attendanceRepository = require('./attendance.repository');
const activityLogger = require('../../core/utils/activityLogger');

class AttendanceService {
  async listSessions({ instituteId, groupId, fromDate, toDate, userRole, userId, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { sessions, total } = await attendanceRepository.listSessions({
      instituteId,
      groupId,
      fromDate,
      toDate,
      userRole,
      userId,
      limit,
      offset
    });

    return {
      sessions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createSession({ instituteId, userId, data }) {
    const { group_id, session_date, start_time, end_time, notes } = data;

    const group = await attendanceRepository.findGroupById(group_id, instituteId);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const existing = await attendanceRepository.findExistingSession(group_id, session_date);
    if (existing) {
      const err = new Error('A session already exists for this group on this date');
      err.status = 409;
      throw err;
    }

    const insertId = await attendanceRepository.createSession({
      institute_id: instituteId,
      group_id,
      session_date,
      start_time,
      end_time,
      notes,
      userId
    });

    return attendanceRepository.findSessionById(insertId, instituteId);
  }

  async getSessionRecords({ sessionId, instituteId }) {
    const session = await attendanceRepository.findSessionById(sessionId, instituteId);
    if (!session) {
      const err = new Error('Session not found');
      err.status = 404;
      throw err;
    }

    const records = await attendanceRepository.getSessionRecords(sessionId, session.group_id);
    return { session, records };
  }

  async saveBulkAttendance({ sessionId, records, instituteId, userId, ipAddress }) {
    const conn = await attendanceRepository.getConnection();
    try {
      await conn.beginTransaction();

      const [sess] = await conn.query('SELECT * FROM attendance_sessions WHERE id = ? AND institute_id = ?', [
        sessionId,
        instituteId
      ]);
      if (!sess.length) {
        await conn.rollback();
        const err = new Error('Session not found');
        err.status = 404;
        throw err;
      }

      for (const rec of records) {
        await conn.query(
          `INSERT INTO attendance_records (session_id, member_id, status, note, marked_by)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (session_id, member_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, modified_by = ?, modified_at = NOW()`,
          [sessionId, rec.member_id, rec.status, rec.note || null, userId, userId]
        );
      }

      await conn.query("UPDATE attendance_sessions SET status = 'completed' WHERE id = ?", [sessionId]);
      await conn.commit();

      await activityLogger.log(
        instituteId,
        userId,
        'MARK_ATTENDANCE',
        'attendance_session',
        sessionId,
        null,
        { count: records.length },
        ipAddress
      );

      return { success: true, message: `Attendance saved for ${records.length} members` };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateRecord({ id, instituteId, user, data, ipAddress }) {
    const { status, note } = data;

    // Check edit window if staff
    if (user.role === 'staff') {
      const sp = await attendanceRepository.getStaffProfile(user.id);
      if (sp && !sp.can_edit_attendance) {
        const err = new Error('Not permitted to edit attendance');
        err.status = 403;
        throw err;
      }

      if (sp) {
        const windowHours = sp.attendance_edit_window_hours || 24;
        const record = await attendanceRepository.getRecordWithSession(id);
        if (record) {
          const sessionDateTime = new Date(record.session_date);
          sessionDateTime.setHours(23, 59, 59);
          const diffHours = (Date.now() - sessionDateTime.getTime()) / 3600000;
          if (diffHours > windowHours) {
            const err = new Error(`Attendance can only be edited within ${windowHours} hours of the session`);
            err.status = 403;
            throw err;
          }
        }
      }
    }

    await attendanceRepository.updateRecord(id, status, note, user.id);
    await activityLogger.log(instituteId, user.id, 'EDIT_ATTENDANCE_RECORD', 'attendance_record', id, null, { status, note }, ipAddress);
    return { success: true, message: 'Attendance updated' };
  }
}

module.exports = new AttendanceService();
