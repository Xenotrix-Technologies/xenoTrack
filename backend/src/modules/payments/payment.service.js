const paymentRepository = require('./payment.repository');
const activityLogger = require('../../core/utils/activityLogger');

class PaymentService {
  async list({ instituteId, memberId, fromDate, toDate, paymentMethod, collectedBy, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { payments, total } = await paymentRepository.list({
      instituteId,
      memberId,
      fromDate,
      toDate,
      paymentMethod,
      collectedBy,
      limit,
      offset
    });

    return {
      payments,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async recordPayment({ instituteId, userId, data, ipAddress }) {
    const conn = await paymentRepository.getConnection();
    try {
      await conn.beginTransaction();
      const { fee_record_id, amount, payment_method, transaction_reference, payment_date, notes } = data;

      const [frRows] = await conn.query(
        'SELECT * FROM fee_records WHERE id = ? AND institute_id = ? FOR UPDATE',
        [fee_record_id, instituteId]
      );
      if (!frRows.length) {
        await conn.rollback();
        const err = new Error('Fee record not found');
        err.status = 404;
        throw err;
      }

      const fr = frRows[0];
      if (fr.status === 'paid' || fr.status === 'waived') {
        await conn.rollback();
        const err = new Error(`Fee record is already ${fr.status}`);
        err.status = 400;
        throw err;
      }

      const payAmt = parseFloat(amount);
      if (payAmt <= 0) {
        await conn.rollback();
        const err = new Error('Amount must be greater than 0');
        err.status = 400;
        throw err;
      }

      if (payAmt > parseFloat(fr.outstanding_balance)) {
        await conn.rollback();
        const err = new Error(`Payment amount (${payAmt}) exceeds outstanding balance (${fr.outstanding_balance})`);
        err.status = 400;
        throw err;
      }

      const prefix = await paymentRepository.getReceiptPrefix(instituteId);
      const lastReceipt = await paymentRepository.getLastReceiptId(instituteId);
      const receiptNumber = `${prefix}-${new Date().getFullYear()}-${String(lastReceipt + 1).padStart(6, '0')}`;

      const [payResult] = await conn.query(
        `INSERT INTO payments (institute_id, fee_record_id, member_id, amount, payment_method, transaction_reference, receipt_number, payment_date, collected_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instituteId,
          fee_record_id,
          fr.member_id,
          payAmt,
          payment_method || 'cash',
          transaction_reference || null,
          receiptNumber,
          payment_date || new Date().toISOString().slice(0, 10),
          userId,
          notes || null
        ]
      );

      const newAmountPaid = parseFloat(fr.amount_paid) + payAmt;
      const outstanding = parseFloat(fr.final_amount) - newAmountPaid;
      const newStatus = outstanding <= 0 ? 'paid' : 'partially_paid';

      await conn.query(
        'UPDATE fee_records SET amount_paid = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [newAmountPaid, newStatus, fee_record_id]
      );

      await conn.commit();
      await activityLogger.log(
        instituteId,
        userId,
        'RECORD_PAYMENT',
        'payment',
        payResult.insertId,
        null,
        { amount: payAmt, receipt_number: receiptNumber },
        ipAddress
      );

      return paymentRepository.findPaymentById(payResult.insertId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getReceipt(id, instituteId) {
    const receipt = await paymentRepository.getReceiptData(id, instituteId);
    if (!receipt) {
      const err = new Error('Payment not found');
      err.status = 404;
      throw err;
    }
    return receipt;
  }

  async reversePayment({ id, instituteId, userId, reason, ipAddress }) {
    const conn = await paymentRepository.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT * FROM payments WHERE id = ? AND institute_id = ? FOR UPDATE', [id, instituteId]);
      if (!rows.length) {
        await conn.rollback();
        const err = new Error('Payment not found');
        err.status = 404;
        throw err;
      }

      const pay = rows[0];
      if (pay.is_reversed) {
        await conn.rollback();
        const err = new Error('Payment already reversed');
        err.status = 400;
        throw err;
      }

      await conn.query('UPDATE payments SET is_reversed = TRUE WHERE id = ?', [id]);
      await conn.query(
        'INSERT INTO payment_reversals (payment_id, reversed_by, reason) VALUES (?, ?, ?)',
        [id, userId, reason || null]
      );

      // Recalculate fee record
      const [frRows] = await conn.query('SELECT * FROM fee_records WHERE id = ? FOR UPDATE', [pay.fee_record_id]);
      const fr = frRows[0];
      const newPaid = Math.max(0, parseFloat(fr.amount_paid) - parseFloat(pay.amount));
      const outstanding = parseFloat(fr.final_amount) - newPaid;
      let newStatus = newPaid <= 0 ? 'unpaid' : 'partially_paid';
      if (fr.due_date && new Date(fr.due_date) < new Date() && outstanding > 0) newStatus = 'overdue';

      await conn.query('UPDATE fee_records SET amount_paid = ?, status = ? WHERE id = ?', [newPaid, newStatus, pay.fee_record_id]);
      await conn.commit();

      await activityLogger.log(instituteId, userId, 'REVERSE_PAYMENT', 'payment', id, pay, { reason }, ipAddress);
      return { success: true, message: 'Payment reversed successfully' };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new PaymentService();
