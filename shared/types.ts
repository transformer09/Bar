// Authentication & Users
export type UserRole = 'manager' | 'bartender' | 'chef' | 'waiter' | 'support';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Inventory
export type InventoryCategory = 'liquor' | 'ingredient' | 'snack' | 'equipment';
export type TransactionType = 'sale' | 'usage' | 'restock' | 'adjustment' | 'waste';
export type TransactionReferenceType = 'bar_sale' | 'kitchen_order' | 'purchase_order' | 'manual';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  maximum_capacity: number;
  reorder_quantity: number;
  unit_cost: number;
  supplier_id?: string;
  last_restocked_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: TransactionType;
  quantity_change: number;
  reference_type: TransactionReferenceType;
  reference_id?: string;
  notes?: string;
  recorded_by: string;
  recorded_at: string;
}

// Suppliers
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
}

// Purchase Orders
export type PurchaseOrderStatus = 'pending' | 'received' | 'partially_received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  total_cost: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_total: number;
}

// Bar Management
export type RecipeCategory = 'cocktail' | 'beer' | 'wine' | 'shot' | 'non_alcoholic';
export type SaleType = 'manual' | 'pos_api';
export type PaymentMethod = 'cash' | 'card' | 'tab' | 'other';

export interface BarRecipe {
  id: string;
  name: string;
  description?: string;
  category: RecipeCategory;
  is_signature: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BarRecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity: number;
  unit: string;
  is_optional: boolean;
}

export interface BarSale {
  id: string;
  sale_timestamp: string;
  sale_type: SaleType;
  bartender_id: string;
  recipe_id?: string;
  custom_item_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: PaymentMethod;
  pos_transaction_id?: string;
  notes?: string;
  created_at: string;
}

export interface Tip {
  id: string;
  bar_sale_id?: string;
  kitchen_order_id?: string;
  bartender_id: string;
  amount: number;
  recorded_at: string;
}

// Promotions
export type PromotionType = 'happy_hour' | 'discount' | 'combo' | 'special_event';
export type DiscountType = 'percentage' | 'fixed_amount';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  promotion_type: PromotionType;
  start_datetime: string;
  end_datetime: string;
  discount_type: DiscountType;
  discount_value: number;
  applicable_items?: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

// Kitchen Management
export type KitchenOrderStatus = 'queued' | 'in_progress' | 'ready' | 'served' | 'cancelled';
export type KitchenOrderPriority = 'normal' | 'high' | 'urgent';

export interface KitchenOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: KitchenOrderStatus;
  priority: KitchenOrderPriority;
  special_requests?: string;
  allergy_notes?: string;
  created_by: string;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  served_at?: string;
  updated_at: string;
}

export interface KitchenOrderItem {
  id: string;
  kitchen_order_id: string;
  inventory_item_id?: string;
  custom_item_name?: string;
  quantity: number;
  unit: string;
  preparation_notes?: string;
}

// Staff Management
export interface StaffSchedule {
  id: string;
  user_id: string;
  scheduled_date: string;
  shift_start: string;
  shift_end: string;
  role_for_shift?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface StaffAttendance {
  id: string;
  user_id: string;
  scheduled_date: string;
  clock_in_time?: string;
  clock_out_time?: string;
  hours_worked?: number;
  status: AttendanceStatus;
  notes?: string;
  recorded_at: string;
}

// Dashboard
export interface DashboardOverview {
  total_sales_today: number;
  total_sales_yesterday: number;
  sales_change_percentage: number;
  active_staff_count: number;
  low_stock_items_count: number;
  pending_orders_count: number;
}

export interface DashboardAlert {
  id: string;
  type: 'low_stock' | 'pending_order' | 'urgent_task' | 'staff_issue';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  reference_id?: string;
  created_at: string;
}

export interface DashboardMetrics {
  period: 'today' | 'week' | 'month';
  total_revenue: number;
  total_transactions: number;
  average_transaction_value: number;
  top_items: Array<{ name: string; quantity: number; revenue: number }>;
  active_staff: number;
  inventory_status: { in_stock: number; low_stock: number; out_of_stock: number };
}

// Reports
export interface SalesReport {
  period: string;
  total_sales: number;
  transaction_count: number;
  average_transaction_value: number;
  by_recipe?: Array<{ name: string; quantity: number; revenue: number }>;
  by_category?: Array<{ category: string; revenue: number }>;
  by_payment_method?: Array<{ method: PaymentMethod; revenue: number }>;
  by_hour?: Array<{ hour: number; revenue: number }>;
}

export interface InventoryReport {
  period: string;
  items_usage: Array<{
    name: string;
    quantity_used: number;
    quantity_sold: number;
    waste: number;
    unit: string;
  }>;
  waste_total: number;
  waste_percentage: number;
}

export interface StaffReport {
  period: string;
  staff_members: Array<{
    id: string;
    name: string;
    role: UserRole;
    hours_worked: number;
    orders_handled: number;
    sales_attributed: number;
    total_tips: number;
    attendance_rate: number;
  }>;
}

export interface ProfitReport {
  period: string;
  revenue: number;
  total_costs: number;
  gross_profit: number;
  profit_margin: number;
  by_category?: Array<{
    category: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
