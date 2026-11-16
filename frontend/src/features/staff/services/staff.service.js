import api from '../../../shared/api/api';

export const staffService = {
  list: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  resetPassword: (id, new_password) => api.post(`/staff/${id}/reset-password`, { new_password }),
};

export default staffService;
