import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../../events/eventSystem';
import { rolePermissionService } from '../../services/rolePermissionService';

export interface POSOrder {
  id: string;
  order_number: string;
  business_type: 'restaurant' | 'bar' | 'lodge';
  customer_name?: string;
  customer_phone?: string;
  table_id?: string;
  room_id?: string;
  items: POSOrderItem[];
  subtotal: number;
  tax: number;
  service_charge: number;
  discount: number;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'cancelled';
  order_status: 'new' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed';
  payment_method?: 'cash' | 'card' | 'mobile' | 'transfer' | 'split';
  staff_id: string;
  staff_name: string;
  created_at: Date;
  updated_at: Date;
  notes?: string;
}

export interface POSOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  customizations?: Record<string, any>;
}

export interface POSSale {
  id: string;
  order_id: string;
  payment_method: 'cash' | 'card' | 'mobile' | 'transfer';
  amount_paid: number;
  change_given?: number;
  transaction_id?: string;
  staff_id: string;
  processed_by: string;
  processed_at: Date;
  notes?: string;
}

export interface POSConfig {
  business_type: 'restaurant' | 'bar' | 'lodge';
  tax_rates: {
    restaurant: number;
    bar: number;
    lodge: number;
  };
  service_charges: {
    restaurant: number;
    bar: number;
    lodge: number;
  };
  payment_methods: string[];
  order_prefixes: {
    restaurant: string;
    bar: string;
    lodge: string;
  };
}

export class POSService {
  private eventEmitter: EventEmitter;
  private orders: Map<string, POSOrder> = new Map();
  private sales: Map<string, POSSale> = new Map();
  private config: POSConfig;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = this.loadConfig();
    this.initializeEventHandlers();
  }

  private loadConfig(): POSConfig {
    return {
      business_type: 'restaurant',
      tax_rates: {
        restaurant: 0.16,    // 16% VAT
        bar: 0.18,           // 18% VAT
        lodge: 0.12           // 12% VAT
      },
      service_charges: {
        restaurant: 0.10,    // 10% service charge
        bar: 0.08,           // 8% service charge
        lodge: 0.05           // 5% service charge
      },
      payment_methods: ['cash', 'card', 'mobile', 'transfer'],
      order_prefixes: {
        restaurant: 'RES',
        bar: 'BAR',
        lodge: 'LDG'
      }
    };
  }

  private initializeEventHandlers(): void {
    // Listen to inventory updates for pricing
    this.eventEmitter.on('inventory_price_updated', (data) => {
      this.updateItemPrices(data.product_id, data.new_price);
    });

    // Listen to reservation confirmations for lodge orders
    this.eventEmitter.on('reservation_confirmed', (data) => {
      this.createLodgeOrderFromReservation(data);
    });

    // Listen to kitchen order updates
    this.eventEmitter.on('kitchen_order_updated', (data) => {
      this.updateOrderStatus(data.order_id, data.status);
    });
  }

  // Create new order
  createOrder(orderData: Partial<POSOrder>, staffId: string): POSOrder {
    const order: POSOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_number: this.generateOrderNumber(orderData.business_type || 'restaurant'),
      business_type: orderData.business_type || 'restaurant',
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      table_id: orderData.table_id,
      room_id: orderData.room_id,
      items: orderData.items || [],
      subtotal: 0,
      tax: 0,
      service_charge: 0,
      discount: 0,
      total_amount: 0,
      payment_status: 'pending',
      order_status: 'new',
      staff_id: staffId,
      staff_name: orderData.staff_name || 'Staff',
      created_at: new Date(),
      updated_at: new Date(),
      notes: orderData.notes
    };

    // Calculate totals
    this.calculateOrderTotals(order);

    // Store order
    this.orders.set(order.id, order);

    // Emit order created event
    eventSystem.emit('order_created', {
      order_id: order.id,
      order_number: order.order_number,
      business_type: order.business_type,
      staff_id: staffId,
      table_id: order.table_id,
      room_id: order.room_id,
      total_amount: order.total_amount
    }, 'pos_service');

    return order;
  }

  // Add item to order
  addItemToOrder(orderId: string, itemData: Partial<POSOrderItem>): POSOrderItem | null {
    const order = this.orders.get(orderId);
    if (!order || order.order_status === 'completed' || order.order_status === 'cancelled') {
      return null;
    }

    const item: POSOrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product_id: itemData.product_id || '',
      product_name: itemData.product_name || 'Unknown Item',
      category: itemData.category || 'general',
      quantity: itemData.quantity || 1,
      unit_price: itemData.unit_price || 0,
      total_price: (itemData.unit_price || 0) * (itemData.quantity || 1),
      notes: itemData.notes,
      customizations: itemData.customizations
    };

    order.items.push(item);
    this.calculateOrderTotals(order);
    order.updated_at = new Date();

    // Emit item added event
    eventSystem.emit('order_item_added', {
      order_id: orderId,
      item: item,
      new_total: order.total_amount
    }, 'pos_service');

    return item;
  }

  // Update item in order
  updateOrderItem(orderId: string, itemId: string, updates: Partial<POSOrderItem>): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;

    const itemIndex = order.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    order.items[itemIndex] = { ...order.items[itemIndex], ...updates };

    // Recalculate item total if quantity or price changed
    if (updates.quantity !== undefined || updates.unit_price !== undefined) {
      order.items[itemIndex].total_price = order.items[itemIndex].quantity * order.items[itemIndex].unit_price;
    }

    this.calculateOrderTotals(order);
    order.updated_at = new Date();

    // Emit item updated event
    eventSystem.emit('order_item_updated', {
      order_id: orderId,
      item_id: itemId,
      updates: updates,
      new_total: order.total_amount
    }, 'pos_service');

    return true;
  }

  // Remove item from order
  removeOrderItem(orderId: string, itemId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;

    const itemIndex = order.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    const removedItem = order.items.splice(itemIndex, 1)[0];
    this.calculateOrderTotals(order);
    order.updated_at = new Date();

    // Emit item removed event
    eventSystem.emit('order_item_removed', {
      order_id: orderId,
      removed_item: removedItem,
      new_total: order.total_amount
    }, 'pos_service');

    return true;
  }

  // Update order status
  updateOrderStatus(orderId: string, status: POSOrder['order_status']): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;

    const oldStatus = order.order_status;
    order.order_status = status;
    order.updated_at = new Date();

    // Emit status update event
    eventSystem.emit('order_status_updated', {
      order_id: orderId,
      old_status: oldStatus,
      new_status: status,
      business_type: order.business_type,
      table_id: order.table_id,
      room_id: order.room_id
    }, 'pos_service');

    return true;
  }

  // Process payment
  processPayment(orderId: string, paymentData: {
    payment_method: 'cash' | 'card' | 'mobile' | 'transfer';
    amount_paid: number;
    staff_id: string;
    processed_by: string;
    notes?: string;
  }): POSSale | null {
    const order = this.orders.get(orderId);
    if (!order || order.payment_status === 'paid') {
      return null;
    }

    const sale: POSSale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_id: orderId,
      payment_method: paymentData.payment_method,
      amount_paid: paymentData.amount_paid,
      change_given: paymentData.amount_paid - order.total_amount,
      transaction_id: `txn_${Date.now()}`,
      staff_id: paymentData.staff_id,
      processed_by: paymentData.processed_by,
      processed_at: new Date(),
      notes: paymentData.notes
    };

    // Update order payment status
    if (paymentData.amount_paid >= order.total_amount) {
      order.payment_status = 'paid';
      order.order_status = 'completed';
      order.payment_method = paymentData.payment_method;
    } else {
      order.payment_status = 'partial';
    }

    order.updated_at = new Date();
    this.sales.set(sale.id, sale);

    // Emit payment processed event
    eventSystem.emit('payment_processed', {
      sale_id: sale.id,
      order_id: orderId,
      payment_method: paymentData.payment_method,
      amount_paid: paymentData.amount_paid,
      total_amount: order.total_amount,
      staff_id: paymentData.staff_id,
      business_type: order.business_type
    }, 'pos_service');

    return sale;
  }

  // Calculate order totals
  private calculateOrderTotals(order: POSOrder): void {
    // Calculate subtotal
    order.subtotal = order.items.reduce((sum, item) => sum + item.total_price, 0);

    // Calculate tax based on business type
    const taxRate = this.config.tax_rates[order.business_type];
    order.tax = order.subtotal * taxRate;

    // Calculate service charge based on business type
    const serviceChargeRate = this.config.service_charges[order.business_type];
    order.service_charge = order.subtotal * serviceChargeRate;

    // Calculate total
    order.total_amount = order.subtotal + order.tax + order.service_charge - order.discount;
  }

  // Generate order number
  private generateOrderNumber(businessType: 'restaurant' | 'bar' | 'lodge'): string {
    const prefix = this.config.order_prefixes[businessType];
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Update item prices when inventory prices change
  private updateItemPrices(productId: string, newPrice: number): void {
    this.orders.forEach(order => {
      if (order.order_status !== 'completed' && order.order_status !== 'cancelled') {
        let updated = false;
        order.items.forEach(item => {
          if (item.product_id === productId) {
            item.unit_price = newPrice;
            item.total_price = item.quantity * newPrice;
            updated = true;
          }
        });

        if (updated) {
          this.calculateOrderTotals(order);
          order.updated_at = new Date();

          // Emit price update event
          eventSystem.emit('order_prices_updated', {
            order_id: order.id,
            product_id: productId,
            new_price: newPrice,
            new_total: order.total_amount
          }, 'pos_service');
        }
      }
    });
  }

  // Create lodge order from reservation
  private createLodgeOrderFromReservation(reservationData: any): void {
    // This would create an order for room charges
    // Implementation depends on reservation system structure
  }

  // Get order by ID
  getOrder(orderId: string): POSOrder | null {
    return this.orders.get(orderId) || null;
  }

  // Get orders by business type
  getOrdersByBusinessType(businessType: 'restaurant' | 'bar' | 'lodge'): POSOrder[] {
    return Array.from(this.orders.values()).filter(order => order.business_type === businessType);
  }

  // Get orders by staff
  getOrdersByStaff(staffId: string): POSOrder[] {
    return Array.from(this.orders.values()).filter(order => order.staff_id === staffId);
  }

  // Get orders by table
  getOrdersByTable(tableId: string): POSOrder[] {
    return Array.from(this.orders.values()).filter(order => order.table_id === tableId);
  }

  // Get orders by room
  getOrdersByRoom(roomId: string): POSOrder[] {
    return Array.from(this.orders.values()).filter(order => order.room_id === roomId);
  }

  // Get active orders
  getActiveOrders(): POSOrder[] {
    return Array.from(this.orders.values()).filter(order =>
      order.order_status !== 'completed' && order.order_status !== 'cancelled'
    );
  }

  // Get sales by date range
  getSalesByDateRange(startDate: Date, endDate: Date): POSSale[] {
    return Array.from(this.sales.values()).filter(sale =>
      sale.processed_at >= startDate && sale.processed_at <= endDate
    );
  }

  // Get sales analytics
  getSalesAnalytics(startDate: Date, endDate: Date): {
    total_sales: number;
    total_orders: number;
    average_order_value: number;
    sales_by_business_type: Record<string, { sales: number; orders: number }>;
    sales_by_payment_method: Record<string, { amount: number; count: number }>;
  } {
    const sales = this.getSalesByDateRange(startDate, endDate);
    const orders = Array.from(this.orders.values()).filter(order =>
      order.created_at >= startDate && order.created_at <= endDate
    );

    const analytics = {
      total_sales: 0,
      total_orders: orders.length,
      average_order_value: 0,
      sales_by_business_type: {} as Record<string, { sales: number; orders: number }>,
      sales_by_payment_method: {} as Record<string, { amount: number; count: number }>
    };

    sales.forEach(sale => {
      analytics.total_sales += sale.amount_paid;

      // Group by payment method
      if (!analytics.sales_by_payment_method[sale.payment_method]) {
        analytics.sales_by_payment_method[sale.payment_method] = { amount: 0, count: 0 };
      }
      analytics.sales_by_payment_method[sale.payment_method].amount += sale.amount_paid;
      analytics.sales_by_payment_method[sale.payment_method].count += 1;
    });

    orders.forEach(order => {
      // Group by business type
      if (!analytics.sales_by_business_type[order.business_type]) {
        analytics.sales_by_business_type[order.business_type] = { sales: 0, orders: 0 };
      }
      analytics.sales_by_business_type[order.business_type].sales += order.total_amount;
      analytics.sales_by_business_type[order.business_type].orders += 1;
    });

    analytics.average_order_value = analytics.total_orders > 0 ? analytics.total_sales / analytics.total_orders : 0;

    return analytics;
  }

  // Update configuration
  updateConfig(newConfig: Partial<POSConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Emit config updated event
    eventSystem.emit('pos_config_updated', {
      updated_config: newConfig
    }, 'pos_service');
  }

  // Get current configuration
  getConfig(): POSConfig {
    return { ...this.config };
  }

  // Event emitter methods
  on(eventType: string, callback: (data: any) => void): void {
    this.eventEmitter.on(eventType, callback);
  }

  emit(eventType: string, data: any): void {
    this.eventEmitter.emit(eventType, data);
  }
}

// Singleton instance
const posService = new POSService();
export default posService;