import { EventEmitter } from 'events';
import { inventoryService } from './inventoryService';
import { receiptService } from './receiptService';
import { notificationService } from './notificationService';

export interface ActivityEvent {
  type: 'order_created' | 'order_updated' | 'stock_movement' | 'payment_received' | 'staff_activity' | 'table_status_change' | 'profit_update';
  timestamp: Date;
  userId?: string;
  userName?: string;
  data: any;
  details?: string;
}

export interface BossMetrics {
  dailyRevenue: number;
  totalOrders: number;
  staffActivities: StaffActivity[];
  stockMovements: StockMovement[];
  profitData: ProfitData;
  activeUsers: number;
  notifications: NotificationCount;
}

export interface StaffActivity {
  id: string;
  userId: string;
  userName: string;
  activity_type: string;
  timestamp: Date;
  data?: any;
  location?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit_cost: number;
  movement_type: 'in' | 'out' | 'adjustment' | 'waste';
  recorded_by: string;
  timestamp: Date;
  reference_type?: string;
  reference_id?: string;
  batch_number?: string;
  expiration_date?: Date;
  notes?: string;
}

export interface ProfitData {
  revenue_by_category: { category: string; revenue: number; cost: number; profit: number; margin: number }[];
  daily_profit: number;
  weekly_profit: number;
  monthly_profit: number;
  profit_trend: 'increasing' | 'decreasing' | 'stable';
}

export class BossAnalyticsService {
  private eventEmitter: EventEmitter;
  private metricsInterval: NodeJS.Timeout | null = null;
  private metrics: BossMetrics | null = null;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.metricsInterval = null;
  }

  // Initialize metrics collection
  startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
    console.log('📊 Boss Analytics: Started real-time metrics collection');
  }

  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private collectMetrics(): void {
    // Get current metrics from all modules
    const metrics: BossMetrics = {
      dailyRevenue: 0,
      totalOrders: 0,
      staffActivities: [],
      stockMovements: [],
      profitData: {
        revenue_by_category: [],
        daily_profit: 0,
        weekly_profit: 0,
        monthly_profit: 0,
        profit_trend: 'stable'
      },
      activeUsers: 0,
      notifications: 0
    };

    // Collect from inventory module
    this.collectInventoryMetrics(metrics);

    // Collect from receipt module
    this.collectReceiptMetrics(metrics);

    // Collect from role-specific activities
    this.collectStaffActivities(metrics);

    // Calculate profit data
    this.calculateProfitMetrics(metrics);

    this.metrics = metrics;
    this.emit('metrics_updated', metrics);
  }

  private collectInventoryMetrics(metrics: BossMetrics): void {
    // This would call inventory service to get stock movements
    // For now, we'll simulate with sample data
    metrics.stockMovements = [
      {
        id: 'SM001',
        itemId: 'INV001',
        itemName: 'Premium Vodka',
        quantity: 2,
        unit_cost: 28.50,
        movement_type: 'out',
        recorded_by: 'Waiter John',
        timestamp: new Date(),
        notes: 'Customer order consumed 2 units'
      },
      {
        id: 'SM002',
        itemId: 'INV002',
        itemName: 'Craft Beer Selection',
        quantity: 6,
        unit_cost: 12.50,
        movement_type: 'out',
        recorded_by: 'Barman Sarah',
        timestamp: new Date(),
        notes: 'Happy hour promotion'
      }
    ];
  }

  private collectReceiptMetrics(metrics: BossMetrics): void {
    // Collect daily revenue and transaction counts
    metrics.dailyRevenue = 3247.50;
    metrics.totalOrders = 156;

    // Collect tip data from receipts
    const tipsCollected = 450.75;
    metrics.totalRevenue += tipsCollected;
    metrics.totalOrders += 28;
  }

  private collectStaffActivities(metrics: BossMetrics): void {
    // Sample staff activities for today
    metrics.staffActivities = [
      {
        id: 'SA001',
        userId: 'user_001',
        userName: 'John Doe',
        activity_type: 'order_taken',
        timestamp: new Date(),
        data: { order_id: 'ORD-123', table: 'T3', amount: 125.50 },
        location: 'Dining Area'
      },
      {
        id: 'SA002',
        userId: 'user_002',
        userName: 'Jane Smith',
        activity_type: 'payment_processed',
        timestamp: new Date(),
        data: { amount: 89.75, payment_method: 'card' },
        location: 'Cashier Station'
      },
      {
        id: 'SA003',
        userId: 'user_003',
        userName: 'Mike Wilson',
        activity_type: 'bar_shift_change',
        timestamp: new Date(),
        data: { shift: 'Evening → Night', from_role: 'bartender', to_role: 'barman' },
        location: 'Bar Station'
      }
    ];
  }

  private calculateProfitMetrics(metrics: BossMetrics): void {
    // Sample profit calculations
    metrics.profitData = {
      revenue_by_category: [
        { category: 'bar', revenue: 1247.50, cost: 623.75, profit: 623.75, margin: 50 },
        { category: 'restaurant', revenue: 2000.00, cost: 1200.00, profit: 800.00, margin: 40 },
        { category: 'lodge', revenue: 500.00, cost: 350.00, profit: 150.00, margin: 30 }
      ],
      daily_profit: 894.50,
      weekly_profit: 6261.50,
      monthly_profit: 25035.00,
      profit_trend: 'increasing'
    };
  }

  getMetrics(): BossMetrics {
    return this.metrics;
  }

  // Get staff activity for specific user
  getStaffActivity(userId: string): StaffActivity[] {
    return this.metrics?.staffActivities.filter(activity => activity.userId === userId) || [];
  }

  // Get stock movements for specific date range
  getStockMovements(startDate?: Date, endDate?: Date): StockMovement[] {
    if (!this.metrics) return [];

    let movements = this.metrics.stockMovements;

    if (startDate) {
      movements = movements.filter(m =>
        new Date(m.timestamp) >= startDate &&
        (!endDate || new Date(m.timestamp) <= endDate)
      );
    }

    return movements.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).reverse();
  }

  // Get profit trends
  getProfitTrends(): ProfitData {
    return this.metrics?.profit_data.profit_trend || 'stable';
  }

  // Emit events for other modules to listen to
  emit(eventType: string, data: any): void {
    this.eventEmitter.emit(eventType, data);
  }

  // Listen to events from other modules
  on(eventType: string, callback: (data: any) => {
    this.eventEmitter.on(eventType, callback);
  }

  // Force metrics refresh
  refreshMetrics(): void {
    this.collectMetrics();
  }

  // Clean up
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    this.eventEmitter.removeAllListeners();
  }
}

// Singleton instance
const bossAnalyticsService = new BossAnalyticsService();
export default bossAnalyticsService;