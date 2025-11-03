import { EventEmitter } from 'events';
import { eventSystem, EventData } from '../../events/eventSystem';
import { rolePermissionService } from '../../services/rolePermissionService';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_threshold: number;
  maximum_capacity: number;
  unit_cost: number;
  selling_price: number;
  supplier_id?: string;
  last_restocked_at?: Date;
  is_active: boolean;
  business_type: 'restaurant' | 'bar' | 'lodge' | 'all';
  created_at: Date;
  updated_at: Date;
}

export interface InventoryBatch {
  id: string;
  inventory_item_id: string;
  batch_number: string;
  quantity: number;
  quantity_remaining: number;
  unit_cost: number;
  unit_selling_price: number;
  received_date: Date;
  expiration_date?: Date;
  supplier_id?: string;
  is_active: boolean;
  created_at: Date;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  batch_id?: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity_change: number;
  unit_cost: number;
  total_cost: number;
  reference_type: 'purchase' | 'sale' | 'kitchen_order' | 'bar_sale' | 'manual' | 'adjustment' | 'waste';
  reference_id?: string;
  notes?: string;
  recorded_by: string;
  recorded_at: Date;
  business_type: 'restaurant' | 'bar' | 'lodge';
}

export interface InventoryAlert {
  id: string;
  inventory_item_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
}

export interface InventoryConfig {
  valuation_method: 'fifo' | 'lifo' | 'average_cost';
  auto_reorder: boolean;
  expiration_alert_days: number;
  low_stock_threshold_percentage: number;
  enable_batch_tracking: boolean;
  enable_waste_tracking: boolean;
  business_types: ('restaurant' | 'bar' | 'lodge')[];
}

export class InventoryService {
  private eventEmitter: EventEmitter;
  private items: Map<string, InventoryItem> = new Map();
  private batches: Map<string, InventoryBatch> = new Map();
  private movements: Map<string, InventoryMovement> = new Map();
  private alerts: Map<string, InventoryAlert> = new Map();
  private config: InventoryConfig;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.config = this.loadConfig();
    this.initializeEventHandlers();
    this.loadSampleData();
  }

  private loadConfig(): InventoryConfig {
    return {
      valuation_method: 'fifo',
      auto_reorder: true,
      expiration_alert_days: 7,
      low_stock_threshold_percentage: 0.2,
      enable_batch_tracking: true,
      enable_waste_tracking: true,
      business_types: ['restaurant', 'bar', 'lodge']
    };
  }

  private initializeEventHandlers(): void {
    // Listen to POS sales for automatic stock updates
    this.eventEmitter.on('order_completed', (data) => {
      this.processOrderStockMovements(data);
    });

    // Listen to kitchen order preparation
    this.eventEmitter.on('kitchen_order_preparing', (data) => {
      this.processKitchenOrderMovements(data);
    });

    // Listen to bar sales
    this.eventEmitter.on('bar_sale_completed', (data) => {
      this.processBarSaleMovements(data);
    });

    // Listen to lodge room service
    this.eventEmitter.on('room_service_ordered', (data) => {
      this.processRoomServiceMovements(data);
    });

    // Listen to purchase orders received
    this.eventEmitter.on('purchase_order_received', (data) => {
      this.processPurchaseOrderReceipt(data);
    });
  }

  private loadSampleData(): void {
    // Sample inventory items
    const sampleItems: InventoryItem[] = [
      {
        id: 'inv_001',
        name: 'Premium Vodka',
        description: 'High-quality premium vodka',
        category: 'spirits',
        unit: 'bottle',
        current_stock: 45,
        minimum_threshold: 10,
        maximum_capacity: 100,
        unit_cost: 28.50,
        selling_price: 85.00,
        supplier_id: 'sup_001',
        last_restocked_at: new Date('2024-01-15'),
        is_active: true,
        business_type: 'bar',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-15')
      },
      {
        id: 'inv_002',
        name: 'Fresh Tomatoes',
        description: 'Organic fresh tomatoes',
        category: 'vegetables',
        unit: 'kg',
        current_stock: 8,
        minimum_threshold: 5,
        maximum_capacity: 50,
        unit_cost: 3.50,
        selling_price: 8.00,
        supplier_id: 'sup_002',
        last_restocked_at: new Date('2024-01-16'),
        is_active: true,
        business_type: 'restaurant',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-16')
      },
      {
        id: 'inv_003',
        name: 'Luxury Towels',
        description: 'Premium hotel towels',
        category: 'linens',
        unit: 'piece',
        current_stock: 25,
        minimum_threshold: 10,
        maximum_capacity: 100,
        unit_cost: 12.00,
        selling_price: 0, // Service item, not sold directly
        supplier_id: 'sup_003',
        last_restocked_at: new Date('2024-01-10'),
        is_active: true,
        business_type: 'lodge',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-10')
      }
    ];

    sampleItems.forEach(item => this.items.set(item.id, item));

    // Sample batches
    const sampleBatches: InventoryBatch[] = [
      {
        id: 'batch_001',
        inventory_item_id: 'inv_001',
        batch_number: 'VOD2024-001',
        quantity: 50,
        quantity_remaining: 45,
        unit_cost: 28.50,
        unit_selling_price: 85.00,
        received_date: new Date('2024-01-15'),
        expiration_date: new Date('2026-12-31'),
        supplier_id: 'sup_001',
        is_active: true,
        created_at: new Date('2024-01-15')
      },
      {
        id: 'batch_002',
        inventory_item_id: 'inv_002',
        batch_number: 'TOM2024-001',
        quantity: 10,
        quantity_remaining: 8,
        unit_cost: 3.50,
        unit_selling_price: 8.00,
        received_date: new Date('2024-01-16'),
        expiration_date: new Date('2024-01-20'),
        supplier_id: 'sup_002',
        is_active: true,
        created_at: new Date('2024-01-16')
      }
    ];

    sampleBatches.forEach(batch => this.batches.set(batch.id, batch));
  }

  // Add stock (receive from supplier)
  addStock(itemData: {
    inventory_item_id: string;
    quantity: number;
    unit_cost: number;
    unit_selling_price?: number;
    supplier_id?: string;
    expiration_date?: Date;
    batch_number?: string;
    notes?: string;
    recorded_by: string;
  }): InventoryBatch | null {
    const item = this.items.get(itemData.inventory_item_id);
    if (!item) return null;

    const batch: InventoryBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inventory_item_id: itemData.inventory_item_id,
      batch_number: itemData.batch_number || `BATCH${Date.now()}`,
      quantity: itemData.quantity,
      quantity_remaining: itemData.quantity,
      unit_cost: itemData.unit_cost,
      unit_selling_price: itemData.unit_selling_price || item.selling_price,
      received_date: new Date(),
      expiration_date: itemData.expiration_date,
      supplier_id: itemData.supplier_id || item.supplier_id,
      is_active: true,
      created_at: new Date()
    };

    // Add batch
    this.batches.set(batch.id, batch);

    // Update item stock
    item.current_stock += itemData.quantity;
    item.last_restocked_at = new Date();
    item.unit_cost = itemData.unit_cost; // Update to latest cost
    if (itemData.unit_selling_price) {
      item.selling_price = itemData.unit_selling_price;
    }
    item.updated_at = new Date();

    // Create movement record
    this.createMovement({
      inventory_item_id: itemData.inventory_item_id,
      batch_id: batch.id,
      movement_type: 'in',
      quantity_change: itemData.quantity,
      unit_cost: itemData.unit_cost,
      total_cost: itemData.quantity * itemData.unit_cost,
      reference_type: 'purchase',
      notes: itemData.notes,
      recorded_by: itemData.recorded_by,
      business_type: item.business_type
    });

    // Check for alerts
    this.checkAlerts(itemData.inventory_item_id);

    // Emit stock added event
    eventSystem.emit('stock_added', {
      item_id: itemData.inventory_item_id,
      batch_id: batch.id,
      quantity: itemData.quantity,
      new_stock_level: item.current_stock,
      unit_cost: itemData.unit_cost
    }, 'inventory_service');

    return batch;
  }

  // Remove stock (sales, usage, waste)
  removeStock(itemData: {
    inventory_item_id: string;
    quantity: number;
    reference_type: 'sale' | 'kitchen_order' | 'bar_sale' | 'manual' | 'waste';
    reference_id?: string;
    notes?: string;
    recorded_by: string;
    business_type: 'restaurant' | 'bar' | 'lodge';
  }): { success: boolean; batches_used: InventoryBatch[]; message?: string } {
    const item = this.items.get(itemData.inventory_item_id);
    if (!item) {
      return { success: false, batches_used: [], message: 'Item not found' };
    }

    if (item.current_stock < itemData.quantity) {
      return { success: false, batches_used: [], message: 'Insufficient stock' };
    }

    // Get available batches based on valuation method
    const batchesToUse = this.getBatchesForUsage(itemData.inventory_item_id, itemData.quantity);

    if (batchesToUse.length === 0) {
      return { success: false, batches_used: [], message: 'No available batches' };
    }

    let totalCost = 0;

    // Update batch quantities and create movements
    batchesToUse.forEach(({ batch, quantityToUse }) => {
      batch.quantity_remaining -= quantityToUse;
      if (batch.quantity_remaining <= 0) {
        batch.is_active = false;
      }

      const batchCost = quantityToUse * batch.unit_cost;
      totalCost += batchCost;

      this.createMovement({
        inventory_item_id: itemData.inventory_item_id,
        batch_id: batch.id,
        movement_type: itemData.reference_type === 'waste' ? 'waste' : 'out',
        quantity_change: -quantityToUse,
        unit_cost: batch.unit_cost,
        total_cost: batchCost,
        reference_type: itemData.reference_type,
        reference_id: itemData.reference_id,
        notes: itemData.notes,
        recorded_by: itemData.recorded_by,
        business_type: itemData.business_type
      });
    });

    // Update item stock
    item.current_stock -= itemData.quantity;
    item.updated_at = new Date();

    // Check for alerts
    this.checkAlerts(itemData.inventory_item_id);

    // Emit stock removed event
    eventSystem.emit('stock_removed', {
      item_id: itemData.inventory_item_id,
      quantity: itemData.quantity,
      new_stock_level: item.current_stock,
      reference_type: itemData.reference_type,
      reference_id: itemData.reference_id,
      business_type: itemData.business_type,
      total_cost: totalCost
    }, 'inventory_service');

    return { success: true, batches_used: batchesToUse.map(b => b.batch) };
  }

  // Get batches for usage based on valuation method
  private getBatchesForUsage(itemId: string, quantityNeeded: number): Array<{ batch: InventoryBatch; quantityToUse: number }> {
    const batches = Array.from(this.batches.values())
      .filter(batch => batch.inventory_item_id === itemId && batch.is_active && batch.quantity_remaining > 0);

    if (batches.length === 0) return [];

    let sortedBatches: InventoryBatch[] = [];

    switch (this.config.valuation_method) {
      case 'fifo':
        // First In, First Out - use oldest batches first
        sortedBatches = batches.sort((a, b) =>
          new Date(a.received_date).getTime() - new Date(b.received_date).getTime()
        );
        break;
      case 'lifo':
        // Last In, First Out - use newest batches first
        sortedBatches = batches.sort((a, b) =>
          new Date(b.received_date).getTime() - new Date(a.received_date).getTime()
        );
        break;
      case 'average_cost':
        // Average Cost - use any available batches (sorted by remaining quantity)
        sortedBatches = batches.sort((a, b) => b.quantity_remaining - a.quantity_remaining);
        break;
    }

    const result: Array<{ batch: InventoryBatch; quantityToUse: number }> = [];
    let remainingNeeded = quantityNeeded;

    for (const batch of sortedBatches) {
      if (remainingNeeded <= 0) break;

      const quantityToUse = Math.min(remainingNeeded, batch.quantity_remaining);
      result.push({ batch, quantityToUse });
      remainingNeeded -= quantityToUse;
    }

    return remainingNeeded > 0 ? [] : result;
  }

  // Create movement record
  private createMovement(movementData: {
    inventory_item_id: string;
    batch_id?: string;
    movement_type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
    quantity_change: number;
    unit_cost: number;
    total_cost: number;
    reference_type: 'purchase' | 'sale' | 'kitchen_order' | 'bar_sale' | 'manual' | 'adjustment' | 'waste';
    reference_id?: string;
    notes?: string;
    recorded_by: string;
    business_type: 'restaurant' | 'bar' | 'lodge';
  }): void {
    const movement: InventoryMovement = {
      id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...movementData,
      recorded_at: new Date()
    };

    this.movements.set(movement.id, movement);
  }

  // Process stock movements from orders
  private processOrderStockMovements(orderData: any): void {
    if (!orderData.items || !Array.isArray(orderData.items)) return;

    orderData.items.forEach((item: any) => {
      this.removeStock({
        inventory_item_id: item.product_id,
        quantity: item.quantity,
        reference_type: 'sale',
        reference_id: orderData.order_id,
        notes: `Order ${orderData.order_number}`,
        recorded_by: orderData.staff_id,
        business_type: orderData.business_type
      });
    });
  }

  private processKitchenOrderMovements(orderData: any): void {
    // Process kitchen order stock movements
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach((item: any) => {
        this.removeStock({
          inventory_item_id: item.inventory_item_id || item.product_id,
          quantity: item.quantity,
          reference_type: 'kitchen_order',
          reference_id: orderData.order_id,
          notes: `Kitchen Order ${orderData.order_number}`,
          recorded_by: orderData.assigned_to || orderData.created_by,
          business_type: 'restaurant'
        });
      });
    }
  }

  private processBarSaleMovements(saleData: any): void {
    // Process bar sale stock movements
    if (saleData.items && Array.isArray(saleData.items)) {
      saleData.items.forEach((item: any) => {
        this.removeStock({
          inventory_item_id: item.product_id,
          quantity: item.quantity,
          reference_type: 'bar_sale',
          reference_id: saleData.sale_id,
          notes: `Bar Sale ${saleData.sale_number}`,
          recorded_by: saleData.bartender_id,
          business_type: 'bar'
        });
      });
    }
  }

  private processRoomServiceMovements(serviceData: any): void {
    // Process room service stock movements
    if (serviceData.items && Array.isArray(serviceData.items)) {
      serviceData.items.forEach((item: any) => {
        this.removeStock({
          inventory_item_id: item.product_id,
          quantity: item.quantity,
          reference_type: 'sale',
          reference_id: serviceData.service_id,
          notes: `Room Service ${serviceData.service_number}`,
          recorded_by: serviceData.staff_id,
          business_type: 'lodge'
        });
      });
    }
  }

  private processPurchaseOrderReceipt(purchaseData: any): void {
    // Process received purchase order
    if (purchaseData.items && Array.isArray(purchaseData.items)) {
      purchaseData.items.forEach((item: any) => {
        this.addStock({
          inventory_item_id: item.inventory_item_id,
          quantity: item.quantity_received,
          unit_cost: item.unit_cost,
          unit_selling_price: item.unit_selling_price,
          supplier_id: purchaseData.supplier_id,
          expiration_date: item.expiration_date,
          batch_number: item.batch_number,
          notes: `Purchase Order ${purchaseData.order_number}`,
          recorded_by: purchaseData.received_by
        });
      });
    }
  }

  // Check and create alerts
  private checkAlerts(itemId: string): void {
    const item = this.items.get(itemId);
    if (!item) return;

    const alerts: InventoryAlert[] = [];

    // Low stock alert
    const lowStockThreshold = item.minimum_threshold;
    if (item.current_stock <= lowStockThreshold && item.current_stock > 0) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inventory_item_id: itemId,
        alert_type: 'low_stock',
        severity: item.current_stock <= lowStockThreshold / 2 ? 'high' : 'medium',
        message: `Low stock alert: ${item.name} has ${item.current_stock} ${item.unit} remaining`,
        is_resolved: false,
        created_at: new Date()
      });
    }

    // Out of stock alert
    if (item.current_stock === 0) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inventory_item_id: itemId,
        alert_type: 'out_of_stock',
        severity: 'critical',
        message: `Out of stock: ${item.name} is completely out of stock`,
        is_resolved: false,
        created_at: new Date()
      });
    }

    // Expiration alerts
    const itemBatches = Array.from(this.batches.values())
      .filter(batch => batch.inventory_item_id === itemId && batch.is_active && batch.expiration_date);

    const today = new Date();
    const alertThresholdDate = new Date(today.getTime() + (this.config.expiration_alert_days * 24 * 60 * 60 * 1000));

    itemBatches.forEach(batch => {
      if (batch.expiration_date) {
        const expirationDate = new Date(batch.expiration_date);

        if (expirationDate <= today) {
          alerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            inventory_item_id: itemId,
            alert_type: 'expired',
            severity: 'critical',
            message: `Expired stock: ${item.name} batch ${batch.batch_number} expired on ${expirationDate.toDateString()}`,
            is_resolved: false,
            created_at: new Date()
          });
        } else if (expirationDate <= alertThresholdDate) {
          alerts.push({
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            inventory_item_id: itemId,
            alert_type: 'expiring_soon',
            severity: 'medium',
            message: `Expiring soon: ${item.name} batch ${batch.batch_number} expires on ${expirationDate.toDateString()}`,
            is_resolved: false,
            created_at: new Date()
          });
        }
      }
    });

    // Store alerts and emit events
    alerts.forEach(alert => {
      this.alerts.set(alert.id, alert);

      eventSystem.emit('inventory_alert', {
        alert_id: alert.id,
        item_id: itemId,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message
      }, 'inventory_service');
    });
  }

  // Get items by business type
  getItemsByBusinessType(businessType: 'restaurant' | 'bar' | 'lodge' | 'all'): InventoryItem[] {
    return Array.from(this.items.values()).filter(item =>
      item.business_type === businessType || item.business_type === 'all'
    );
  }

  // Get low stock items
  getLowStockItems(): InventoryItem[] {
    return Array.from(this.items.values()).filter(item =>
      item.current_stock <= item.minimum_threshold
    );
  }

  // Get expiring items
  getExpiringItems(days: number = 7): Array<{ item: InventoryItem; batch: InventoryBatch; daysToExpiry: number }> {
    const today = new Date();
    const thresholdDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));

    const result: Array<{ item: InventoryItem; batch: InventoryBatch; daysToExpiry: number }> = [];

    this.batches.forEach(batch => {
      if (batch.is_active && batch.expiration_date && batch.expiration_date <= thresholdDate) {
        const item = this.items.get(batch.inventory_item_id);
        if (item) {
          const daysToExpiry = Math.ceil((batch.expiration_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          result.push({ item, batch, daysToExpiry });
        }
      }
    });

    return result.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }

  // Get inventory valuation
  getInventoryValuation(): {
    total_value: number;
    total_cost: number;
    valuation_by_method: Record<string, number>;
    valuation_by_category: Record<string, number>;
  } {
    const valuation = {
      total_value: 0,
      total_cost: 0,
      valuation_by_method: {
        fifo: 0,
        lifo: 0,
        average_cost: 0
      },
      valuation_by_category: {} as Record<string, number>
    };

    this.items.forEach(item => {
      const itemBatches = Array.from(this.batches.values())
        .filter(batch => batch.inventory_item_id === item.id && batch.is_active);

      if (itemBatches.length > 0) {
        const itemValuation = this.calculateItemValuation(item, itemBatches);

        valuation.total_value += itemValuation.current_value;
        valuation.total_cost += itemValuation.current_cost;
        valuation.valuation_by_method.fifo += itemValuation.fifo_value;
        valuation.valuation_by_method.lifo += itemValuation.lifo_value;
        valuation.valuation_by_method.average_cost += itemValuation.average_cost_value;

        if (!valuation.valuation_by_category[item.category]) {
          valuation.valuation_by_category[item.category] = 0;
        }
        valuation.valuation_by_category[item.category] += itemValuation.current_value;
      }
    });

    return valuation;
  }

  private calculateItemValuation(item: InventoryItem, batches: InventoryBatch[]): {
    current_value: number;
    current_cost: number;
    fifo_value: number;
    lifo_value: number;
    average_cost_value: number;
  } {
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity_remaining, 0);

    if (totalQuantity === 0) {
      return {
        current_value: 0,
        current_cost: 0,
        fifo_value: 0,
        lifo_value: 0,
        average_cost_value: 0
      };
    }

    // Current valuation (using current selling price)
    const currentValue = totalQuantity * item.selling_price;

    // FIFO valuation
    const fifoBatches = [...batches].sort((a, b) =>
      new Date(a.received_date).getTime() - new Date(b.received_date).getTime()
    );
    let fifoCost = 0;
    let remaining = totalQuantity;
    for (const batch of fifoBatches) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, batch.quantity_remaining);
      fifoCost += quantity * batch.unit_cost;
      remaining -= quantity;
    }

    // LIFO valuation
    const lifoBatches = [...batches].sort((a, b) =>
      new Date(b.received_date).getTime() - new Date(a.received_date).getTime()
    );
    let lifoCost = 0;
    remaining = totalQuantity;
    for (const batch of lifoBatches) {
      if (remaining <= 0) break;
      const quantity = Math.min(remaining, batch.quantity_remaining);
      lifoCost += quantity * batch.unit_cost;
      remaining -= quantity;
    }

    // Average cost valuation
    const totalCost = batches.reduce((sum, batch) => sum + (batch.quantity_remaining * batch.unit_cost), 0);
    const averageCost = totalCost / totalQuantity;
    const averageCostValue = totalQuantity * averageCost;

    return {
      current_value: currentValue,
      current_cost: totalCost,
      fifo_value: fifoCost,
      lifo_value: lifoCost,
      average_cost_value: averageCostValue
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<InventoryConfig>): void {
    this.config = { ...this.config, ...newConfig };

    eventSystem.emit('inventory_config_updated', {
      updated_config: newConfig
    }, 'inventory_service');
  }

  // Get current configuration
  getConfig(): InventoryConfig {
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
const inventoryService = new InventoryService();
export default inventoryService;