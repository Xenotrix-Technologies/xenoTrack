import api from '../../../shared/api/api';

export const dashboardService = {
  getAdmin: () => api.get('/dashboard/admin'),
  getStaff: () => api.get('/dashboard/staff'),
};

export default dashboardService;
