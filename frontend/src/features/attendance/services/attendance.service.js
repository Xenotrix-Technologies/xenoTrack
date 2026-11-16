import api from '../../../shared/api/api';

export const attendanceService = {
  listSessions: (params) => api.get('/attendance/sessions', { params }),
  createSession: (data) => api.post('/attendance/sessions', data),
  getSessionRecords: (sessionId) => api.get(`/attendance/sessions/${sessionId}/records`),
  saveBulk: (data) => api.post('/attendance/records/bulk', data),
  updateRecord: (id, data) => api.put(`/attendance/records/${id}`, data),
};

export default attendanceService;
