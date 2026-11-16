import api from '../../../shared/api/api';
import { groupService } from '../../groups/services/group.service';

export const programService = {
  listPrograms: (params) => api.get('/programs', { params }),
  createProgram: (data) => api.post('/programs', data),
  updateProgram: (id, data) => api.put(`/programs/${id}`, data),

  // Backward compatibility / convenience aliases for group & enrollment operations
  listGroups: (params) => groupService.listGroups(params),
  getGroup: (id) => groupService.getGroup(id),
  createGroup: (data) => groupService.createGroup(data),
  updateGroup: (id, data) => groupService.updateGroup(id, data),
  assignStaff: (groupId, data) => groupService.assignStaff(groupId, data),
  removeStaff: (groupId, staffId) => groupService.removeStaff(groupId, staffId),
  enroll: (data) => groupService.enroll(data),
  updateEnrollment: (id, data) => groupService.updateEnrollment(id, data),
};

export default programService;
