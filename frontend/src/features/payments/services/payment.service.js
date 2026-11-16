import api from '../../../shared/api/api';

export const paymentService = {
  listPayments: (params) => api.get('/fees/payments', { params }),
  createPayment: (data) => api.post('/fees/payments', data),
  getReceipt: (id) => api.get(`/fees/payments/${id}/receipt`),
  reversePayment: (id, reason) => api.post(`/fees/payments/${id}/reverse`, { reason }),
};

export default paymentService;
