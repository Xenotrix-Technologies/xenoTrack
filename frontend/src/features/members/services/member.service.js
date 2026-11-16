import api from '../../../shared/api/api';

export const memberService = {
  list: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  updateStatus: (id, status) => api.patch(`/members/${id}/status`, { status }),
};

export default memberService;
