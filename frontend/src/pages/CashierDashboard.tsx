import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Bell,
  Eye,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  BarChart3,
  X,
  Check,
  AlertTriangle,
  CreditCardIcon,
  BanknoteIcon,
  SmartphoneIcon
} from 'lucide-react';

interface PaymentRequest {
  id: string;
  orderId: string;
  tableNumber?: string;
  customerName?: string;
  waiterName: string;
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'mobile' | 'split';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  specialInstructions?: string;
}

interface PaymentStats {
  todayTotal: number;
  todayOrders: number;
  pendingPayments: number;
  averageOrderValue: number;
  paymentMethods: {
    cash: number;
    card: number;
    mobile: number;
    split: number;
  };
  hourlyData: Array<{
    hour: number;
    sales: number;
    orders: number;
  }>;
}

export const CashierDashboard: React.FC = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sample payment requests
  useEffect(() => {
    const samplePaymentRequests: PaymentRequest[] = [
      {
        id: 'PAY-001',
        orderId: 'ORD-1234',
        tableNumber: 'T2',
        customerName: 'John Smith',
        waiterName: 'Jane Doe',
        amount: 125.50,
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        items: [
          { name: 'Heineken', quantity: 2, price: 12.00 },
          { name: 'Mojito', quantity: 1, price: 18.00 },
          { name: 'Classic Burger', quantity: 1, price: 25.00 },
          { name: 'Caesar Salad', quantity: 1, price: 18.00 }
        ],
        orderType: 'dine-in',
        specialInstructions: 'Extra napkins please'
      },
      {
        id: 'PAY-002',
        orderId: 'ORD-1235',
        tableNumber: 'T3',
        customerName: 'Emily Johnson',
        waiterName: 'Mike Wilson',
        amount: 280.75,
        status: 'pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        items: [
          { name: 'Johnnie Walker Black', quantity: 1, price: 45.00 },
          { name: 'Grey Goose Vodka', quantity: 1, price: 38.00 },
          { name: 'Margarita', quantity: 2, price: 16.00 },
          { name: 'Old Fashioned', quantity: 1, price: 22.00 },
          { name: 'Chicken Wings', quantity: 2, price: 20.00 }
        ],
        orderType: 'dine-in'
      },
      {
        id: 'PAY-003',
        orderId: 'ORD-1236',
        customerName: 'Robert Brown',
        waiterName: 'Sarah Davis',
        amount: 67.00,
        status: 'processing',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        paymentMethod: 'card',
        items: [
          { name: 'Bacardi Superior', quantity: 1, price: 28.00 },
          { name: 'Coca Cola', quantity: 3, price: 6.00 },
          { name: 'Lemonade', quantity: 1, price: 7.00 }
        ],
        orderType: 'takeaway'
      },
      {
        id: 'PAY-004',
        orderId: 'ORD-1237',
        tableNumber: 'T6',
        customerName: 'Lisa Anderson',
        waiterName: 'Tom Harris',
        amount: 95.00,
        status: 'completed',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        paymentMethod: 'cash',
        items: [
          { name: 'Guinness Draught', quantity: 2, price: 14.00 },
          { name: 'Mojito', quantity: 2, price: 18.00 },
          { name: 'Fresh Orange Juice', quantity: 2, price: 8.00 }
        ],
        orderType: 'dine-in'
      }
    ];

    setPaymentRequests(samplePaymentRequests);

    const sampleStats: PaymentStats = {
      todayTotal: 3847.25,
      todayOrders: 124,
      pendingPayments: 2,
      averageOrderValue: 31.03,
      paymentMethods: {
        cash: 1450.50,
        card: 1896.75,
        mobile: 350.00,
        split: 150.00
      },
      hourlyData: Array.from({ length: 12 }, (_, i) => ({
        hour: i + 11,
        sales: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 20) + 5
      }))
    };

    setStats(sampleStats);
  }, []);

  const handlePaymentConfirmation = async (paymentId: string, paymentMethod: 'cash' | 'card' | 'mobile', amountReceived: number) => {
    setPaymentRequests(prev => prev.map(payment =>
      payment.id === paymentId
        ? { ...payment, status: 'completed', paymentMethod }
        : payment
    ));

    setShowPaymentModal(false);
    setSelectedPayment(null);

    // Show success notification
    setTimeout(() => {
      alert('Payment confirmed successfully!');
    }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return RefreshCw;
      case 'completed': return CheckCircle;
      case 'failed': return AlertTriangle;
      default: return AlertCircle;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return BanknoteIcon;
      case 'card': return CreditCardIcon;
      case 'mobile': return SmartphoneIcon;
      default: return CreditCard;
    }
  };

  const filteredPayments = paymentRequests.filter(payment => {
    const matchesSearch = payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Cashier Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">Payment Processing & Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Today's Revenue</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.todayTotal)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-bold text-blue-600">{stats.todayOrders}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-lg font-bold text-orange-600">{stats.pendingPayments}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  className={`p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayTotal)}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">+12.5% from yesterday</span>
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
                <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-xs text-blue-600">+8.3% from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageOrderValue)}</p>
                <div className="flex items-center mt-1">
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-xs text-red-600">-2.1% from yesterday</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600">Requires attention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
            <div className="space-y-4">
              {Object.entries(stats.paymentMethods).map(([method, amount]) => {
                const percentage = (amount / stats.todayTotal) * 100;
                const Icon = getPaymentMethodIcon(method);

                return (
                  <div key={method} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">{method}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center justify-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>View All Payments</span>
              </button>
              <button className="w-full p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export Report</span>
              </button>
              <button className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center space-x-2">
                <Printer className="w-5 h-5" />
                <span>Print Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Requests */}
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment Requests</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const StatusIcon = getStatusIcon(payment.status);

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.orderId}</div>
                          <div className="text-sm text-gray-500">
                            {payment.orderType === 'dine-in' ? `Table ${payment.tableNumber}` : payment.orderType}
                          </div>
                          <div className="text-xs text-gray-400">Waiter: {payment.waiterName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.customerName || 'Walk-in'}</div>
                          <div className="text-sm text-gray-500">{payment.items.length} items</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                        {payment.paymentMethod && (
                          <div className="text-xs text-gray-500 capitalize">{payment.paymentMethod}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {payment.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-1 text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowPaymentModal(true);
                              }}
                              className="p-1 text-green-600 hover:text-green-900"
                              title="Process Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowReceiptModal(true);
                              }}
                              className="p-1 text-purple-600 hover:text-purple-900"
                              title="View Receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600">Order</p>
                    <p className="font-semibold">{selectedPayment.orderId}</p>
                    <p className="text-sm text-gray-600">Customer: {selectedPayment.customerName}</p>
                    <p className="text-sm text-gray-600">Waiter: {selectedPayment.waiterName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Select Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePaymentConfirmation(selectedPayment.id, 'cash', selectedPayment.amount)}
                    className="p-4 border-2 border-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <BanknoteIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Cash</p>
                  </button>
                  <button
                    onClick={() => handlePaymentConfirmation(selectedPayment.id, 'card', selectedPayment.amount)}
                    className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <CreditCardIcon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Card</p>
                  </button>
                  <button
                    onClick={() => handlePaymentConfirmation(selectedPayment.id, 'mobile', selectedPayment.amount)}
                    className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <SmartphoneIcon className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Mobile</p>
                  </button>
                  <button
                    onClick={() => {
                      // Handle split payment
                      alert('Split payment feature coming soon!');
                    }}
                    className="p-4 border-2 border-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-medium">Split</p>
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Default to cash payment
                    handlePaymentConfirmation(selectedPayment.id, 'cash', selectedPayment.amount);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-lg text-gray-900">Payment Successful</h4>
                <p className="text-sm text-gray-600">Receipt #REC-{Date.now()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">{selectedPayment.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{selectedPayment.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span className="text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
                  <Printer className="w-4 h-4 inline mr-2" />
                  Print
                </button>
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all">
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};