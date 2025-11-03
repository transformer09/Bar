import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  MessageSquare,
  Phone,
  Mail,
  Bell,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  User,
  Receipt,
  FileText,
  Send,
  Printer,
  Star,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Target,
  Zap,
  Shield,
  Lock,
  Unlock,
  CreditCardIcon,
  BanknoteIcon,
  SmartphoneIcon,
  Globe,
  Wifi
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditScore: number;
  totalCreditLimit: number;
  availableCredit: number;
  isActive: boolean;
  registrationDate: Date;
  lastPaymentDate?: Date;
  totalBorrowed: number;
  totalRepaid: number;
  notes?: string;
  preferences: {
    smsNotifications: boolean;
    emailNotifications: boolean;
    preferredPaymentMethod: 'cash' | 'card' | 'mobile';
  };
}

interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'overdue' | 'defaulted' | 'paused';
  purpose: string;
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDue: Date;
  totalPaid: number;
  missedPayments: number;
  collateral?: string;
  guarantor?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  loanId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionReference?: string;
  notes?: string;
  processedBy: string;
  createdAt: Date;
}

interface Reminder {
  id: string;
  loanId: string;
  customerId: string;
  type: 'payment_due' | 'overdue' | 'final_notice' | 'thank_you';
  scheduledDate: Date;
  sentDate?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channel: 'sms' | 'email' | 'both';
  message: string;
  template: string;
  isAutomatic: boolean;
}

interface CreditStats {
  totalActiveLoans: number;
  totalLoanedAmount: number;
  totalRepaidAmount: number;
  overdueLoans: number;
  overdueAmount: number;
  monthlyRevenue: number;
  averageLoanSize: number;
  defaultRate: number;
  newApplications: number;
  totalCustomers: number;
  activeCustomers: number;
  paymentSuccessRate: number;
  averageLoanTerm: number;
}

export const CreditManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'loans' | 'customers' | 'payments' | 'reminders'>('overview');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sample data
  useEffect(() => {
    const sampleCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        creditScore: 750,
        totalCreditLimit: 5000,
        availableCredit: 2200,
        isActive: true,
        registrationDate: new Date('2023-01-15'),
        lastPaymentDate: new Date('2024-10-20'),
        totalBorrowed: 2800,
        totalRepaid: 1600,
        preferences: {
          smsNotifications: true,
          emailNotifications: true,
          preferredPaymentMethod: 'mobile'
        }
      },
      {
        id: '2',
        name: 'Emily Johnson',
        email: 'emily.j@email.com',
        phone: '+0987654321',
        address: '456 Oak Ave, City, State 67890',
        creditScore: 680,
        totalCreditLimit: 3000,
        availableCredit: 1500,
        isActive: true,
        registrationDate: new Date('2023-03-20'),
        lastPaymentDate: new Date('2024-10-15'),
        totalBorrowed: 1500,
        totalRepaid: 1200,
        preferences: {
          smsNotifications: false,
          emailNotifications: true,
          preferredPaymentMethod: 'card'
        }
      },
      {
        id: '3',
        name: 'Michael Davis',
        email: 'michael.davis@email.com',
        phone: '+1122334455',
        address: '789 Pine Rd, City, State 11223',
        creditScore: 720,
        totalCreditLimit: 8000,
        availableCredit: 6500,
        isActive: true,
        registrationDate: new Date('2023-06-10'),
        totalBorrowed: 1500,
        totalRepaid: 1500,
        preferences: {
          smsNotifications: true,
          emailNotifications: true,
          preferredPaymentMethod: 'cash'
        }
      },
      {
        id: '4',
        name: 'Sarah Wilson',
        email: 'sarah.w@email.com',
        phone: '+5544332211',
        address: '321 Elm St, City, State 33445',
        creditScore: 590,
        totalCreditLimit: 2000,
        availableCredit: 500,
        isActive: true,
        registrationDate: new Date('2023-09-05'),
        lastPaymentDate: new Date('2024-09-01'),
        totalBorrowed: 1500,
        totalRepaid: 500,
        preferences: {
          smsNotifications: true,
          emailNotifications: false,
          preferredPaymentMethod: 'mobile'
        }
      }
    ];

    const sampleLoans: Loan[] = [
      {
        id: 'LOAN-001',
        customerId: '1',
        customerName: 'John Smith',
        amount: 800,
        interestRate: 5.5,
        termMonths: 6,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-03-01'),
        status: 'active',
        purpose: 'Emergency home repair',
        monthlyPayment: 135.50,
        remainingBalance: 600,
        nextPaymentDue: new Date('2024-11-01'),
        totalPaid: 200,
        missedPayments: 0,
        collateral: 'Personal guarantee',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-10-20')
      },
      {
        id: 'LOAN-002',
        customerId: '2',
        customerName: 'Emily Johnson',
        amount: 500,
        interestRate: 6.0,
        termMonths: 3,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-01-01'),
        status: 'active',
        purpose: 'Medical expenses',
        monthlyPayment: 170.50,
        remainingBalance: 329.50,
        nextPaymentDue: new Date('2024-11-01'),
        totalPaid: 170.50,
        missedPayments: 0,
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-20')
      },
      {
        id: 'LOAN-003',
        customerId: '3',
        customerName: 'Michael Davis',
        amount: 1500,
        interestRate: 4.5,
        termMonths: 12,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-07-01'),
        status: 'completed',
        purpose: 'Business investment',
        monthlyPayment: 128.13,
        remainingBalance: 0,
        nextPaymentDue: new Date('2024-12-01'),
        totalPaid: 1500,
        missedPayments: 0,
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-10-15')
      },
      {
        id: 'LOAN-004',
        customerId: '4',
        customerName: 'Sarah Wilson',
        amount: 1000,
        interestRate: 8.0,
        termMonths: 4,
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-12-15'),
        status: 'overdue',
        purpose: 'Educational expenses',
        monthlyPayment: 250.75,
        remainingBalance: 750,
        nextPaymentDue: new Date('2024-10-15'),
        totalPaid: 250,
        missedPayments: 1,
        collateral: 'Electronics items',
        guarantor: 'James Wilson (Brother)',
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-10-20')
      }
    ];

    const samplePayments: Payment[] = [
      {
        id: 'PAY-001',
        loanId: 'LOAN-001',
        customerId: '1',
        customerName: 'John Smith',
        amount: 135.50,
        paymentDate: new Date('2024-10-20'),
        paymentMethod: 'mobile',
        status: 'completed',
        transactionReference: 'TXN123456',
        processedBy: 'system',
        createdAt: new Date('2024-10-20')
      },
      {
        id: 'PAY-002',
        loanId: 'LOAN-002',
        customerId: '2',
        customerName: 'Emily Johnson',
        amount: 170.50,
        paymentDate: new Date('2024-10-15'),
        paymentMethod: 'card',
        status: 'completed',
        transactionReference: 'TXN789012',
        processedBy: 'system',
        createdAt: new Date('2024-10-15')
      },
      {
        id: 'PAY-003',
        loanId: 'LOAN-003',
        customerId: '3',
        customerName: 'Michael Davis',
        amount: 128.13,
        paymentDate: new Date('2024-10-10'),
        paymentMethod: 'cash',
        status: 'completed',
        processedBy: 'cashier-001',
        createdAt: new Date('2024-10-10')
      }
    ];

    const sampleReminders: Reminder[] = [
      {
        id: 'REM-001',
        loanId: 'LOAN-001',
        customerId: '1',
        type: 'payment_due',
        scheduledDate: new Date('2024-11-01'),
        status: 'pending',
        channel: 'both',
        message: 'Reminder: Your payment of $135.50 for loan LOAN-001 is due on November 1st, 2024.',
        template: 'payment_reminder',
        isAutomatic: true
      },
      {
        id: 'REM-002',
        loanId: 'LOAN-004',
        customerId: '4',
        type: 'overdue',
        scheduledDate: new Date('2024-10-25'),
        status: 'pending',
        channel: 'sms',
        message: 'URGENT: Your loan LOAN-004 payment is overdue. Please contact us immediately to avoid further charges.',
        template: 'overdue_notice',
        isAutomatic: true
      }
    ];

    const sampleStats: CreditStats = {
      totalActiveLoans: 3,
      totalLoanedAmount: 3300,
      totalRepaidAmount: 1870.50,
      overdueLoans: 1,
      overdueAmount: 750,
      monthlyRevenue: 1250,
      averageLoanSize: 1100,
      defaultRate: 2.5,
      newApplications: 5,
      totalCustomers: 4,
      activeCustomers: 4,
      paymentSuccessRate: 95.5,
      averageLoanTerm: 6.25
    };

    setCustomers(sampleCustomers);
    setLoans(sampleLoans);
    setPayments(samplePayments);
    setReminders(sampleReminders);
    setStats(sampleStats);
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getLoanStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'defaulted': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sendReminder = async (reminderId: string) => {
    // Simulate sending reminder
    setReminders(prev => prev.map(r =>
      r.id === reminderId
        ? { ...r, status: 'sent', sentDate: new Date() }
        : r
    ));

    setTimeout(() => {
      alert('Reminder sent successfully!');
    }, 500);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'loans', name: 'Loans', icon: CreditCard },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'payments', name: 'Payments', icon: DollarSign },
    { id: 'reminders', name: 'Reminders', icon: Bell }
  ];

  const loanStatuses = ['all', 'active', 'completed', 'overdue', 'defaulted', 'paused'];

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
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Credit Management
                  </h1>
                  <p className="text-xs text-gray-500">Loan & Credit Tracking System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Active Loans</p>
                  <p className="text-lg font-bold text-green-600">{stats.totalActiveLoans}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.totalLoanedAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Overdue</p>
                  <p className="text-lg font-bold text-red-600">{stats.overdueLoans}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshData}
                  disabled={refreshing}
                  className={`p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Credit Overview</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Loans</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalActiveLoans}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">+12% this month</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Loaned</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalLoanedAmount)}</p>
                      <div className="flex items-center mt-1">
                        <DollarSign className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-xs text-gray-500">Avg: {formatCurrency(stats.averageLoanSize)}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Overdue Loans</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
                      <div className="flex items-center mt-1">
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-xs text-red-600">{formatCurrency(stats.overdueAmount)} overdue</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.monthlyRevenue)}</p>
                      <div className="flex items-center mt-1">
                        <Activity className="w-4 h-4 text-purple-500 mr-1" />
                        <span className="text-xs text-gray-500">{stats.paymentSuccessRate}% success rate</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Loans</h3>
                  <div className="space-y-3">
                    {loans.slice(0, 5).map((loan) => (
                      <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{loan.customerName}</p>
                          <p className="text-sm text-gray-600">{loan.purpose}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLoanStatusColor(loan.status)}`}>
                            {loan.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{payment.customerName}</p>
                          <p className="text-sm text-gray-600">{payment.paymentDate.toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending Reminders */}
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Scheduled Reminders</h3>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Bell className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {reminders.filter(r => r.status === 'pending').map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{reminder.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">Due: {reminder.scheduledDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {reminder.channel.toUpperCase()}
                        </span>
                        <button
                          onClick={() => sendReminder(reminder.id)}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                        >
                          Send Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Loan Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search loans..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {loanStatuses.map(status => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowLoanModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Loan
                  </button>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount & Terms
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Next Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{loan.id}</div>
                              <div className="text-sm text-gray-500">{loan.purpose}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{loan.customerName}</div>
                              <div className="text-sm text-gray-500">
                                {loan.startDate.toLocaleDateString()} - {loan.endDate.toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{formatCurrency(loan.amount)}</div>
                              <div className="text-sm text-gray-600">
                                {loan.interestRate}% APR • {loan.termMonths} months
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(loan.monthlyPayment)}/month
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLoanStatusColor(loan.status)}`}>
                              {loan.status}
                            </span>
                            {loan.missedPayments > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {loan.missedPayments} missed payments
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">
                                {loan.nextPaymentDue.toLocaleDateString()}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(loan.monthlyPayment)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Balance: {formatCurrency(loan.remainingBalance)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedLoan(loan)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                  <div key={customer.id} className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-600">Customer since {customer.registrationDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Credit Score</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                customer.creditScore >= 700 ? 'bg-green-500' :
                                customer.creditScore >= 600 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${(customer.creditScore / 850) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{customer.creditScore}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Credit Limit</span>
                        <span className="font-medium">{formatCurrency(customer.totalCreditLimit)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Available</span>
                        <span className="font-medium text-green-600">{formatCurrency(customer.availableCredit)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Borrowed</span>
                        <span className="font-medium">{formatCurrency(customer.totalBorrowed)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Repaid</span>
                        <span className="font-medium text-green-600">{formatCurrency(customer.totalRepaid)}</span>
                      </div>

                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Notifications</span>
                          <div className="flex items-center space-x-2">
                            {customer.preferences.smsNotifications && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>SMS</span>
                              </div>
                            )}
                            {customer.preferences.emailNotifications && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span>Email</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-3">
                        <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <CreditCard className="w-4 h-4 inline mr-1" />
                          View Loans
                        </button>
                        <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </button>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer & Loan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Processed By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => {
                        const getMethodIcon = (method: string) => {
                          switch (method) {
                            case 'cash': return BanknoteIcon;
                            case 'card': return CreditCardIcon;
                            case 'mobile': return SmartphoneIcon;
                            default: return DollarSign;
                          }
                        };
                        const MethodIcon = getMethodIcon(payment.paymentMethod);

                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{payment.id}</div>
                                <div className="text-sm text-gray-500">{payment.paymentDate.toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{payment.customerName}</div>
                                <div className="text-sm text-gray-500">Loan: {payment.loanId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <MethodIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-sm capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.status)}`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{payment.processedBy}</div>
                              {payment.transactionReference && (
                                <div className="text-xs text-gray-500">{payment.transactionReference}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="text-gray-600 hover:text-gray-900">
                                  <Receipt className="w-4 h-4" />
                                </button>
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
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reminder Management</h2>
                <div className="flex items-center space-x-4">
                  <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4 mr-2" />
                    SMS Settings
                  </button>
                  <button
                    onClick={() => setShowReminderModal(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reminder
                  </button>
                </div>
              </div>

              {/* SMS Configuration */}
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option>Twilio</option>
                      <option>Nexmo</option>
                      <option>ClickSend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      placeholder="Enter API key"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://your-app.com/webhook"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Scheduled Reminders */}
              <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Scheduled Reminders</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            reminder.type === 'overdue' ? 'bg-red-100 text-red-600' :
                            reminder.type === 'payment_due' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 capitalize">
                              {reminder.type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">{reminder.message}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                Due: {reminder.scheduledDate.toLocaleDateString()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                reminder.channel === 'both' ? 'bg-purple-100 text-purple-700' :
                                reminder.channel === 'sms' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {reminder.channel.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded ${
                                reminder.status === 'sent' ? 'bg-green-100 text-green-700' :
                                reminder.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {reminder.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {reminder.status === 'pending' && (
                            <button
                              onClick={() => sendReminder(reminder.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Send Now
                            </button>
                          )}
                          <button className="p-1 text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};