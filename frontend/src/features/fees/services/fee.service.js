import api from '../../../shared/api/api';

export const feeService = {
  listPlans: (params) => api.get('/fees/plans', { params }),
  createPlan: (data) => api.post('/fees/plans', data),
  updatePlan: (id, data) => api.put(`/fees/plans/${id}`, data),
  listRecords: (params) => api.get('/fees/records', { params }),
  createRecord: (data) => api.post('/fees/records', data),
  updateRecord: (id, data) => api.put(`/fees/records/${id}`, data),
  listPayments: (params) => api.get('/fees/payments', { params }),
  createPayment: (data) => api.post('/fees/payments', data),
  getReceipt: (id) => api.get(`/fees/payments/${id}/receipt`),
  reversePayment: (id, reason) => api.post(`/fees/payments/${id}/reverse`, { reason }),
};

export default feeService;
