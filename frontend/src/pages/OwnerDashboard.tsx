import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  Bell,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Coffee,
  Wine,
  Beer,
  Utensils,
  Smartphone,
  CreditCard,
  MapPin,
  Star,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  UserCheck,
  UserX,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Heart,
  ShoppingCart,
  Receipt,
  Printer,
  Settings,
  Monitor,
  Bed,
  CreditCard as LoanIcon,
  Calendar as BookingIcon
} from 'lucide-react';

interface ActivityMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  profitMargin: number;
  growthRate: number;
  topPerformingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
    category: string;
  }>;
  staffPerformance: Array<{
    id: string;
    name: string;
    role: string;
    ordersServed: number;
    revenue: number;
    rating: number;
    status: 'online' | 'offline' | 'busy';
  }>;
  tableOccupancy: {
    total: number;
    occupied: number;
    available: number;
    turnoverRate: number;
  };
  alerts: Array<{
    id: string;
    type: 'low_stock' | 'high_value' | 'unusual' | 'staff';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    actionRequired: boolean;
  }>;
  realTimeActivity: Array<{
    id: string;
    type: 'order' | 'payment' | 'staff' | 'inventory';
    description: string;
    user: string;
    timestamp: Date;
    amount?: number;
  }>;
}

interface ModuleStats {
  pos: {
    revenue: number;
    orders: number;
    customers: number;
  };
  inventory: {
    totalValue: number;
    lowStockItems: number;
    expiringItems: number;
    movements: number;
  };
  lodge: {
    occupied: number;
    total: number;
    revenue: number;
    bookings: number;
  };
  loan: {
    activeLoans: number;
    totalAmount: number;
    overdueLoans: number;
    monthlyRevenue: number;
  };
}

export const OwnerDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);
  const [moduleStats, setModuleStats] = useState<ModuleStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const timeRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    fetchDashboardData();
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      // Simulate API call with sample data
      const sampleMetrics: ActivityMetrics = {
        totalRevenue: 8475.50,
        totalOrders: 156,
        totalCustomers: 89,
        averageOrderValue: 54.33,
        profitMargin: 68.5,
        growthRate: 12.3,
        topPerformingItems: [
          { name: 'Heineken', quantity: 45, revenue: 540.00, category: 'beer' },
          { name: 'Mojito', quantity: 32, revenue: 576.00, category: 'cocktails' },
          { name: 'Classic Burger', quantity: 28, revenue: 700.00, category: 'food' },
          { name: 'Johnnie Walker Black', quantity: 18, revenue: 810.00, category: 'spirits' },
          { name: 'Margarita', quantity: 24, revenue: 384.00, category: 'cocktails' }
        ],
        staffPerformance: [
          { id: '1', name: 'John Doe', role: 'Waiter', ordersServed: 42, revenue: 2340.50, rating: 4.8, status: 'online' },
          { id: '2', name: 'Jane Smith', role: 'Bartender', ordersServed: 38, revenue: 2156.00, rating: 4.9, status: 'busy' },
          { id: '3', name: 'Mike Wilson', role: 'Waiter', ordersServed: 35, revenue: 1876.00, rating: 4.6, status: 'online' },
          { id: '4', name: 'Sarah Davis', role: 'Cashier', ordersServed: 41, revenue: 2103.00, rating: 4.7, status: 'online' }
        ],
        tableOccupancy: {
          total: 12,
          occupied: 8,
          available: 4,
          turnoverRate: 3.2
        },
        alerts: [
          {
            id: '1',
            type: 'low_stock',
            message: 'Johnnie Walker Black is running low (5 units left)',
            severity: 'high',
            timestamp: new Date(Date.now() - 1000 * 60 * 10),
            actionRequired: true
          },
          {
            id: '2',
            type: 'unusual',
            message: 'Unusual spike in cocktail orders detected',
            severity: 'medium',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            actionRequired: false
          },
          {
            id: '3',
            type: 'staff',
            message: 'Waiter Tom Harris has been offline for 2 hours',
            severity: 'medium',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            actionRequired: true
          },
          {
            id: '4',
            type: 'high_value',
            message: 'Large order placed: $485.00 at Table T6',
            severity: 'low',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            actionRequired: false
          }
        ],
        realTimeActivity: [
          {
            id: '1',
            type: 'order',
            description: 'New order #1234 placed at Table T2',
            user: 'John Doe',
            timestamp: new Date(Date.now() - 1000 * 60 * 2),
            amount: 125.50
          },
          {
            id: '2',
            type: 'payment',
            description: 'Payment received for order #1233',
            user: 'Sarah Davis',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            amount: 89.75
          },
          {
            id: '3',
            type: 'staff',
            description: 'Jane Smith logged in',
            user: 'Jane Smith',
            timestamp: new Date(Date.now() - 1000 * 60 * 15)
          },
          {
            id: '4',
            type: 'inventory',
            description: 'Low stock alert for Premium Vodka',
            user: 'System',
            timestamp: new Date(Date.now() - 1000 * 60 * 20)
          }
        ]
      };

      const sampleModuleStats: ModuleStats = {
        pos: {
          revenue: 8475.50,
          orders: 156,
          customers: 89
        },
        inventory: {
          totalValue: 25680.00,
          lowStockItems: 12,
          expiringItems: 8,
          movements: 45
        },
        lodge: {
          occupied: 8,
          total: 10,
          revenue: 2150.00,
          bookings: 12
        },
        loan: {
          activeLoans: 24,
          totalAmount: 12450.00,
          overdueLoans: 3,
          monthlyRevenue: 1250.00
        }
      };

      setMetrics(sampleMetrics);
      setModuleStats(sampleModuleStats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return Package;
      case 'high_value': return DollarSign;
      case 'unusual': return TrendingUp;
      case 'staff': return Users;
      default: return AlertCircle;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'payment': return CreditCard;
      case 'staff': return Users;
      case 'inventory': return Package;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!metrics || !moduleStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Owner Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">Complete Business Overview</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Auto Refresh</span>
              </button>

              {/* Alerts Button */}
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="relative p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {metrics.alerts.filter(a => a.actionRequired).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {/* Manual Refresh */}
              <button
                onClick={refreshData}
                disabled={refreshing}
                className={`p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ${
                  refreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  {metrics.growthRate > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metrics.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}% growth
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.totalOrders}</p>
                <div className="flex items-center mt-1">
                  <Users className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600">{metrics.totalCustomers} customers</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Order</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.averageOrderValue)}</p>
                <div className="flex items-center mt-1">
                  <Target className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-600">Per transaction</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.profitMargin}%</p>
                <div className="flex items-center mt-1">
                  <Activity className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600">Net profit ratio</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Module Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">POS System</h3>
              <CreditCard className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-100">Revenue</span>
                <span className="font-bold">{formatCurrency(moduleStats.pos.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Orders</span>
                <span className="font-bold">{moduleStats.pos.orders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Customers</span>
                <span className="font-bold">{moduleStats.pos.customers}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Inventory</h3>
              <Package className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-100">Total Value</span>
                <span className="font-bold">{formatCurrency(moduleStats.inventory.totalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Low Stock</span>
                <span className="font-bold">{moduleStats.inventory.lowStockItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Expiring</span>
                <span className="font-bold">{moduleStats.inventory.expiringItems}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lodge</h3>
              <Bed className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-purple-100">Occupied</span>
                <span className="font-bold">{moduleStats.lodge.occupied}/{moduleStats.lodge.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Revenue</span>
                <span className="font-bold">{formatCurrency(moduleStats.lodge.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Bookings</span>
                <span className="font-bold">{moduleStats.lodge.bookings}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Credit Mgmt</h3>
              <LoanIcon className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-orange-100">Active Loans</span>
                <span className="font-bold">{moduleStats.loan.activeLoans}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-100">Total Amount</span>
                <span className="font-bold">{formatCurrency(moduleStats.loan.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-100">Overdue</span>
                <span className="font-bold text-red-200">{moduleStats.loan.overdueLoans}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performing Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Items</h3>
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {metrics.topPerformingItems.map((item, index) => {
                  const categoryIcons = {
                    beer: Beer,
                    cocktails: Coffee,
                    food: Utensils,
                    spirits: Wine
                  };
                  const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || Package;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.quantity} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                        <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Staff Performance</h3>
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  <Users className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {metrics.staffPerformance.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`}>
                            {staff.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{staff.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(staff.revenue)}</p>
                      <div className="flex items-center justify-end space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{staff.rating}</span>
                        <span className="text-xs text-gray-500">({staff.ordersServed} orders)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Table Occupancy */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Table Occupancy</h3>
                <Monitor className="w-5 h-5 text-gray-600" />
              </div>
              <div className="space-y-3">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {metrics.tableOccupancy.occupied}/{metrics.tableOccupancy.total}
                  </p>
                  <p className="text-sm text-gray-600">Tables Occupied</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">
                      {Math.round((metrics.tableOccupancy.occupied / metrics.tableOccupancy.total) * 100)}%
                    </p>
                    <p className="text-xs text-gray-600">Occupancy Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-purple-600">
                      {metrics.tableOccupancy.turnoverRate}
                    </p>
                    <p className="text-xs text-gray-600">Turnover Rate</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Activity */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Real-time Activity</h3>
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {metrics.realTimeActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.user}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                        </div>
                        {activity.amount && (
                          <p className="text-sm font-medium text-green-600">{formatCurrency(activity.amount)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm">
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  Generate Report
                </button>
                <button className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all text-sm">
                  <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                  Send Message
                </button>
                <button className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-sm">
                  <Printer className="w-4 h-4 mx-auto mb-1" />
                  Print Summary
                </button>
                <button className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm">
                  <Settings className="w-4 h-4 mx-auto mb-1" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {showAlerts && (
        <div className="fixed right-4 top-20 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-100">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
              <button
                onClick={() => setShowAlerts(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {metrics.alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    alert.actionRequired ? 'bg-red-50' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                        {alert.actionRequired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            Action Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};