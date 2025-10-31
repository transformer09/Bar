import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// ============ PAYMENT METHODS ============

// GET /api/cashier/payment-methods - List payment methods
router.get('/payment-methods', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ PAYMENTS ============

// GET /api/cashier/payments/pending - Get pending payments
router.get('/payments/pending', requireRole('cashier', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, orders(order_number, total_amount, waiter_id, users(first_name, last_name)), payment_methods(name)')
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/cashier/payments/order/:orderId - Get payments for order
router.get('/payments/order/:orderId', async (req: AuthRequest, res, next) => {
  try {
    const { orderId } = req.params;
    const { data, error } = await supabase
      .from('payments')
      .select('*, payment_methods(name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/cashier/payments - Create payment record
router.post('/payments', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { order_id, payment_method_id, amount, notes } = req.body;

    if (!order_id || !payment_method_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id,
          payment_method_id,
          amount,
          notes: notes || null,
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/cashier/payments/:id/confirm - Confirm payment (cashier)
router.put('/payments/:id/confirm', requireRole('cashier', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { transaction_reference } = req.body;

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError) throw paymentError;

    // Update payment status
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        payment_status: 'completed',
        cashier_id: req.user.id,
        confirmed_at: new Date().toISOString(),
        transaction_reference: transaction_reference || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single();

    if (orderError) throw orderError;

    // Check if all payments received
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('order_id', payment.order_id)
      .eq('payment_status', 'completed');

    const totalPaid = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    let newPaymentStatus = 'pending';
    if (totalPaid >= order.total_amount) {
      newPaymentStatus = 'paid';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partial';
    }

    // Update order payment status
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ payment_status: newPaymentStatus })
      .eq('id', payment.order_id);

    if (orderUpdateError) throw orderUpdateError;

    res.json(updatedPayment);
  } catch (error) {
    next(error);
  }
});

// PUT /api/cashier/payments/:id/refund - Refund payment (cashier/manager)
router.put('/payments/:id/refund', requireRole('cashier', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { reason } = req.body;

    const { data, error } = await supabase
      .from('payments')
      .update({
        payment_status: 'refunded',
        cashier_id: req.user.id,
        notes: reason || 'Refunded',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update order payment status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', data.order_id);

    if (orderError) throw orderError;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ============ CASHIER SETTLEMENT ============

// GET /api/cashier/settlement - Get settlement data for period
router.get('/settlement', requireRole('cashier', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('payments')
      .select('*, orders(total_amount), payment_methods(name, type)')
      .eq('payment_status', 'completed');

    if (start_date) {
      query = query.gte('confirmed_at', start_date);
    }

    if (end_date) {
      query = query.lte('confirmed_at', end_date);
    }

    const { data, error } = await query.order('confirmed_at', { ascending: false });

    if (error) throw error;

    // Calculate totals by payment method
    const summary: any = {
      total_amount: 0,
      total_transactions: 0,
      by_method: {},
    };

    data?.forEach((payment: any) => {
      summary.total_amount += payment.amount;
      summary.total_transactions += 1;

      const method = payment.payment_methods?.name || 'Unknown';
      if (!summary.by_method[method]) {
        summary.by_method[method] = 0;
      }
      summary.by_method[method] += payment.amount;
    });

    res.json({ payments: data, summary });
  } catch (error) {
    next(error);
  }
});

// POST /api/cashier/settlement/close - Close settlement period
router.post('/settlement/close', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { start_date, end_date, notes } = req.body;

    // Get all completed payments in period
    let query = supabase
      .from('payments')
      .select('amount, payment_methods(type)')
      .eq('payment_status', 'completed');

    if (start_date) query = query.gte('confirmed_at', start_date);
    if (end_date) query = query.lte('confirmed_at', end_date);

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) throw paymentsError;

    const totalAmount = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    res.json({
      settlement: {
        start_date,
        end_date,
        total_amount: totalAmount,
        transaction_count: payments?.length || 0,
        closed_by: req.user.id,
        closed_at: new Date().toISOString(),
        notes,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
