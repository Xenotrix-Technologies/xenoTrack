import api from '../../../shared/api/api';

export const programService = {
  listPrograms: (params) => api.get('/programs', { params }),
  createProgram: (data) => api.post('/programs', data),
  updateProgram: (id, data) => api.put(`/programs/${id}`, data),
};

export default programService;
