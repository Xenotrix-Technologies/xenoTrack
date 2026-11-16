import api from '../../../shared/api/api';

export const reportService = {
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getCollections: (params) => api.get('/reports/collections', { params }),
  getOutstanding: (params) => api.get('/reports/outstanding-fees', { params }),
};

export default reportService;
