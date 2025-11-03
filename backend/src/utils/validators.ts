import { z } from 'zod';

// Auth validators
export const SignupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['manager', 'bartender', 'chef', 'waiter', 'support']),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// Inventory validators
export const InventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['liquor', 'ingredient', 'snack', 'equipment']),
  unit: z.string().min(1, 'Unit is required'),
  current_stock: z.number().nonnegative('Stock must be non-negative'),
  minimum_threshold: z.number().nonnegative('Threshold must be non-negative'),
  maximum_capacity: z.number().nonnegative('Capacity must be non-negative'),
  reorder_quantity: z.number().positive('Reorder quantity must be positive'),
  unit_cost: z.number().nonnegative('Unit cost must be non-negative'),
  supplier_id: z.string().uuid().optional(),
});

export const ManualAdjustmentSchema = z.object({
  inventory_item_id: z.string().uuid(),
  quantity_change: z.number(),
  notes: z.string().optional(),
  reference_type: z.enum(['bar_sale', 'kitchen_order', 'purchase_order', 'manual']),
});

// Bar validators
export const BarSaleSchema = z.object({
  recipe_id: z.string().uuid().optional(),
  custom_item_name: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_price: z.number().positive('Price must be positive'),
  payment_method: z.enum(['cash', 'card', 'tab', 'other']),
  notes: z.string().optional(),
});

export const BarRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().optional(),
  category: z.enum(['cocktail', 'beer', 'wine', 'shot', 'non_alcoholic']),
  is_signature: z.boolean().default(false),
  ingredients: z.array(
    z.object({
      inventory_item_id: z.string().uuid(),
      quantity: z.number().positive(),
      unit: z.string(),
      is_optional: z.boolean().default(false),
    })
  ),
});

export const PromotionSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  description: z.string().optional(),
  promotion_type: z.enum(['happy_hour', 'discount', 'combo', 'special_event']),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  discount_type: z.enum(['percentage', 'fixed_amount']),
  discount_value: z.number().positive(),
  applicable_items: z.array(z.string().uuid()).optional(),
});

// Kitchen validators
export const KitchenOrderSchema = z.object({
  items: z.array(
    z.object({
      inventory_item_id: z.string().uuid().optional(),
      custom_item_name: z.string().optional(),
      quantity: z.number().positive(),
      unit: z.string(),
      preparation_notes: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
  special_requests: z.string().optional(),
  allergy_notes: z.string().optional(),
});

// Staff validators
export const StaffScheduleSchema = z.object({
  user_id: z.string().uuid(),
  scheduled_date: z.string().date(),
  shift_start: z.string().time(),
  shift_end: z.string().time(),
  role_for_shift: z.string().optional(),
  notes: z.string().optional(),
});

export const ClockInSchema = z.object({
  user_id: z.string().uuid(),
  scheduled_date: z.string().date(),
});

export const ClockOutSchema = z.object({
  user_id: z.string().uuid(),
  scheduled_date: z.string().date(),
});

// Purchase order validators
export const PurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),
  expected_delivery_date: z.string().date(),
  items: z.array(
    z.object({
      inventory_item_id: z.string().uuid(),
      quantity_ordered: z.number().positive(),
      unit_price: z.number().positive(),
    })
  ).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});
