import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { BarRecipeSchema, BarSaleSchema, PromotionSchema } from '../utils/validators';

const router = Router();

// ============ RECIPES ============

// GET /api/bar/recipes - List all recipes
router.get('/recipes', async (req: AuthRequest, res, next) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('bar_recipes')
      .select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/bar/recipes/:id - Recipe details + ingredients
router.get('/recipes/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data: recipe, error: recipeError } = await supabase
      .from('bar_recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) throw recipeError;

    const { data: ingredients, error: ingredientsError } = await supabase
      .from('bar_recipe_ingredients')
      .select('*, inventory_items(name, unit, current_stock)')
      .eq('recipe_id', id);

    if (ingredientsError) throw ingredientsError;

    res.json({
      ...recipe,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bar/recipes - Create recipe (manager, bartender)
router.post('/recipes', requireRole('manager', 'bartender'), async (req: AuthRequest, res, next) => {
  try {
    const input = BarRecipeSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('bar_recipes')
      .insert([
        {
          name: input.name,
          description: input.description || null,
          category: input.category,
          is_signature: input.is_signature,
          created_by: req.user.id,
        },
      ])
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Create ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('bar_recipe_ingredients')
      .insert(
        input.ingredients.map((ing) => ({
          recipe_id: recipe.id,
          inventory_item_id: ing.inventory_item_id,
          quantity: ing.quantity,
          unit: ing.unit,
          is_optional: ing.is_optional,
        }))
      )
      .select();

    if (ingredientsError) throw ingredientsError;

    res.status(201).json({
      ...recipe,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bar/recipes/:id - Update recipe (manager, bartender)
router.put('/recipes/:id', requireRole('manager', 'bartender'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const input = BarRecipeSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('bar_recipes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bar/recipes/:id - Delete recipe (manager only)
router.delete('/recipes/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Delete ingredients first
    const { error: ingredientsError } = await supabase
      .from('bar_recipe_ingredients')
      .delete()
      .eq('recipe_id', id);

    if (ingredientsError) throw ingredientsError;

    // Delete recipe
    const { data, error } = await supabase
      .from('bar_recipes')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ============ SALES ============

// GET /api/bar/sales - List sales
router.get('/sales', async (req: AuthRequest, res, next) => {
  try {
    const { bartender_id, start_date, end_date } = req.query;

    let query = supabase
      .from('bar_sales')
      .select('*, bar_recipes(name), users(first_name, last_name)');

    if (bartender_id) {
      query = query.eq('bartender_id', bartender_id);
    }

    if (start_date) {
      query = query.gte('sale_timestamp', start_date);
    }

    if (end_date) {
      query = query.lte('sale_timestamp', end_date);
    }

    const { data, error } = await query.order('sale_timestamp', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/bar/sales - Record drink sale
router.post('/sales', requireRole('bartender', 'manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = BarSaleSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create sale
    const { data: sale, error: saleError } = await supabase
      .from('bar_sales')
      .insert([
        {
          sale_type: 'manual',
          bartender_id: req.user.id,
          recipe_id: input.recipe_id || null,
          custom_item_name: input.custom_item_name || null,
          quantity: input.quantity,
          unit_price: input.unit_price,
          total_price: input.quantity * input.unit_price,
          payment_method: input.payment_method,
          notes: input.notes || null,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // Update inventory if recipe selected
    if (input.recipe_id) {
      const { data: recipe, error: recipeError } = await supabase
        .from('bar_recipe_ingredients')
        .select('*')
        .eq('recipe_id', input.recipe_id);

      if (recipeError) throw recipeError;

      // Update each ingredient
      for (const ingredient of recipe || []) {
        const quantityToDeduct = ingredient.quantity * input.quantity;

        const { data: item } = await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', ingredient.inventory_item_id)
          .single();

        if (item && item.current_stock < quantityToDeduct) {
          return res.status(400).json({
            error: 'Insufficient stock for ingredient',
          });
        }

        // Deduct inventory
        const newStock = (item?.current_stock || 0) - quantityToDeduct;

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ current_stock: newStock })
          .eq('id', ingredient.inventory_item_id);

        if (updateError) throw updateError;

        // Record transaction
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert([
            {
              inventory_item_id: ingredient.inventory_item_id,
              transaction_type: 'sale',
              quantity_change: -quantityToDeduct,
              reference_type: 'bar_sale',
              reference_id: sale.id,
              recorded_by: req.user.id,
            },
          ]);

        if (txError) throw txError;
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
});

// ============ PROMOTIONS ============

// GET /api/bar/promotions - List active promotions
router.get('/promotions', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_datetime', now)
      .gte('end_datetime', now);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/bar/promotions - Create promotion (manager only)
router.post('/promotions', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const input = PromotionSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert([
        {
          ...input,
          created_by: req.user.id,
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

// PUT /api/bar/promotions/:id - Update promotion (manager only)
router.put('/promotions/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const input = PromotionSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('promotions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/bar/promotions/:id - End promotion (manager only)
router.delete('/promotions/:id', requireRole('manager'), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('promotions')
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

// ============ TIPS ============

// POST /api/bar/tips - Record tip
router.post('/tips', requireRole('bartender'), async (req: AuthRequest, res, next) => {
  try {
    const { bar_sale_id, amount } = req.body;

    if (!req.user || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid tip data' });
    }

    const { data, error } = await supabase
      .from('tips')
      .insert([
        {
          bar_sale_id: bar_sale_id || null,
          bartender_id: req.user.id,
          amount,
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

// GET /api/bar/tips - List tips
router.get('/tips', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { bartender_id, start_date, end_date } = req.query;

    let query = supabase.from('tips').select('*');

    if (req.user.role !== 'manager') {
      query = query.eq('bartender_id', req.user.id);
    } else if (bartender_id) {
      query = query.eq('bartender_id', bartender_id);
    }

    if (start_date) {
      query = query.gte('recorded_at', start_date);
    }

    if (end_date) {
      query = query.lte('recorded_at', end_date);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
