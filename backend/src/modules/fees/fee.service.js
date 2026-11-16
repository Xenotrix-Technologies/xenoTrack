const feeRepository = require('./fee.repository');
const activityLogger = require('../../core/utils/activityLogger');

class FeeService {
  async listPlans(instituteId, status) {
    return feeRepository.listPlans(instituteId, status);
  }

  async createPlan({ instituteId, userId, data, ipAddress }) {
    const insertId = await feeRepository.createPlan({
      ...data,
      institute_id: instituteId
    });
    await activityLogger.log(instituteId, userId, 'CREATE_FEE_PLAN', 'fee_plan', insertId, null, data, ipAddress);
    return feeRepository.findPlanById(insertId, instituteId);
  }

  async updatePlan({ id, instituteId, userId, data, ipAddress }) {
    const existing = await feeRepository.findPlanById(id, instituteId);
    if (!existing) {
      const err = new Error('Fee plan not found');
      err.status = 404;
      throw err;
    }

    await feeRepository.updatePlan(id, instituteId, data);
    await activityLogger.log(instituteId, userId, 'UPDATE_FEE_PLAN', 'fee_plan', id, existing, data, ipAddress);
    return feeRepository.findPlanById(id, instituteId);
  }

  async listRecords({ instituteId, memberId, status, fromDate, toDate, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { records, total } = await feeRepository.listRecords({
      instituteId,
      memberId,
      status,
      fromDate,
      toDate,
      limit,
      offset
    });

    return {
      records,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createRecord({ instituteId, userId, data, ipAddress }) {
    const { member_id, enrollment_id, fee_plan_id, billing_period_label, original_amount, discount_amount, late_fee_amount, due_date, notes } = data;

    const disc = parseFloat(discount_amount || 0);
    const late = parseFloat(late_fee_amount || 0);
    const orig = parseFloat(original_amount);
    const final_amount = orig - disc + late;

    const insertId = await feeRepository.createRecord({
      institute_id: instituteId,
      member_id,
      enrollment_id,
      fee_plan_id,
      billing_period_label,
      original_amount: orig,
      discount_amount: disc,
      late_fee_amount: late,
      final_amount,
      due_date,
      notes,
      userId
    });

    await activityLogger.log(instituteId, userId, 'CREATE_FEE_RECORD', 'fee_record', insertId, null, data, ipAddress);
    return feeRepository.findRecordById(insertId, instituteId);
  }

  async updateRecord({ id, instituteId, userId, data, ipAddress }) {
    const existing = await feeRepository.findRecordById(id, instituteId);
    if (!existing) {
      const err = new Error('Fee record not found');
      err.status = 404;
      throw err;
    }

    const disc = parseFloat(data.discount_amount ?? existing.discount_amount);
    const late = parseFloat(data.late_fee_amount ?? existing.late_fee_amount);
    const final_amount = parseFloat(existing.original_amount) - disc + late;

    let newStatus = data.status || existing.status;
    if (existing.amount_paid >= final_amount && final_amount > 0) newStatus = 'paid';
    else if (existing.amount_paid > 0 && existing.amount_paid < final_amount) newStatus = 'partially_paid';

    await feeRepository.updateRecord(id, {
      discount_amount: disc,
      late_fee_amount: late,
      final_amount,
      notes: data.notes || existing.notes,
      status: newStatus
    });

    await activityLogger.log(instituteId, userId, 'UPDATE_FEE_RECORD', 'fee_record', id, existing, data, ipAddress);
    return feeRepository.findRecordById(id, instituteId);
  }
}

module.exports = new FeeService();
