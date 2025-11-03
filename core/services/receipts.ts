import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { receiptService } from '../services/receiptService';

const router = Router();

// ============ RECEIPT TEMPLATES ============

// GET /api/receipts/templates - List all receipt templates
router.get('/templates', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/receipts/templates/:type - Get template by type
router.get('/templates/type/:type', async (req: AuthRequest, res, next) => {
  try {
    const { type } = req.params;
    const { data, error } = await supabase
      .from('receipt_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .single();
    if (error) throw error;
    res.json(data || {});
  } catch (error) {
    next(error);
  }
});

// POST /api/receipts/templates - Create template (manager)
router.post('/templates', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('receipt_templates')
      .insert([{ ...req.body, created_by: req.user.id }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/receipts/templates/:id - Update template (manager)
router.put('/templates/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('receipt_templates')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/receipts/templates/:id - Delete template (manager)
router.delete('/templates/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('receipt_templates').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============ GENERATE & MANAGE RECEIPTS ============

// POST /api/receipts/generate/invoice - Generate invoice receipt (waiter during order)
router.post('/generate/invoice', requireRole('waiter', 'bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const receipt = await receiptService.generateInvoiceReceipt(order_id, req.user.id);
    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
});

// POST /api/receipts/generate/final - Generate final receipt (after payment)
router.post('/generate/final', requireRole('cashier', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const receipt = await receiptService.generateFinalReceipt(order_id, req.user.id);
    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
});

// GET /api/receipts/order/:orderId - Get all receipts for order
router.get('/order/:orderId', async (req: AuthRequest, res, next) => {
  try {
    const { orderId } = req.params;
    const { data, error } = await supabase
      .from('generated_receipts')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/receipts/:id - Get receipt content
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('generated_receipts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/receipts/:id/print - Mark receipt as printed
router.put('/:id/print', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('generated_receipts')
      .update({ printed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// PUT /api/receipts/:id/email - Mark receipt as emailed
router.put('/:id/email', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('generated_receipts')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/receipts/:id - Delete receipt
router.delete('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('generated_receipts').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
