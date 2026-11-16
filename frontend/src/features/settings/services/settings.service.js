import api from '../../../shared/api/api';

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getActivityLogs: (params) => api.get('/settings/activity-logs', { params }),
  getGenderOptions: (params) => api.get('/settings/gender-options', { params }),
  createGenderOption: (data) => api.post('/settings/gender-options', data),
  updateGenderOption: (id, data) => api.put(`/settings/gender-options/${id}`, data),
  toggleGenderOptionStatus: (id, status) => api.patch(`/settings/gender-options/${id}/status`, { status }),
  deleteGenderOption: (id) => api.delete(`/settings/gender-options/${id}`),
  reorderGenderOptions: (items) => api.put('/settings/gender-options/reorder', { items }),
};

export default settingsService;
