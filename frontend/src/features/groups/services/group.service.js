import api from '../../../shared/api/api';

export const groupService = {
  listGroups: (params) => api.get('/groups', { params }),
  getGroup: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  assignStaff: (groupId, data) => api.post(`/groups/${groupId}/staff`, data),
  removeStaff: (groupId, staffId) => api.delete(`/groups/${groupId}/staff/${staffId}`),
  enroll: (data) => api.post('/enrollments', data),
  updateEnrollment: (id, data) => api.put(`/enrollments/${id}`, data),
};

export default groupService;
