import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/suppliers - List all suppliers
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/suppliers - Add new supplier (manager only)
router.post('/', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { name, contact_person, email, phone, address, payment_terms } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name,
          contact_person: contact_person || null,
          email: email || null,
          phone: phone || null,
          address: address || null,
          payment_terms: payment_terms || null,
          is_active: true,
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

// PUT /api/suppliers/:id - Update supplier info (manager only)
router.put('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/suppliers/:id - Soft delete supplier (manager only)
router.delete('/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;
