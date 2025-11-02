import React, { useState, useEffect } from 'react';
import {
  Settings,
  Palette,
  Type,
  Layout,
  Users,
  Shield,
  Bell,
  Database,
  Smartphone,
  Monitor,
  Printer,
  CreditCard,
  Package,
  Zap,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  Moon,
  Sun,
  Code,
  Key,
  Lock,
  Unlock,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Target,
  BarChart3,
  FileText,
  Image,
  Video,
  Music,
  Wifi,
  Bluetooth
} from 'lucide-react';

interface SystemTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderRadius: string;
  fontSize: string;
  fontFamily: string;
  isDark: boolean;
  customCSS?: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  permissions: Record<string, boolean>;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: Date;
}

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  phone?: string;
  avatar?: string;
  preferences: Record<string, any>;
}

interface ReceiptTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'receipt';
  template: string;
  variables: string[];
  isEnabled: boolean;
  isDefault: boolean;
  preview: string;
}

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  recipients: string[];
  triggers: string[];
  isEnabled: boolean;
}

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    restaurantName: 'Modern Bar & Restaurant',
    address: '123 Main St, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@modernbar.com',
    website: 'www.modernbar.com',
    taxRate: 10,
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });

  // Theme Settings
  const [currentTheme, setCurrentTheme] = useState<SystemTheme>({
    id: 'default',
    name: 'Modern Blue',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    accentColor: '#10B981',
    borderRadius: '12px',
    fontSize: '16px',
    fontFamily: 'Inter, sans-serif',
    isDark: false
  });

  // POS Settings
  const [posSettings, setPosSettings] = useState({
    enableTableManagement: true,
    defaultOrderType: 'dine-in',
    autoPrintReceipt: false,
    requireCustomerName: false,
    enableTips: true,
    tipPercentages: [10, 15, 20, 25],
    enableSplitPayments: true,
    maxSplitAmount: 10,
    enableDiscounts: true,
    maxDiscountPercentage: 25,
    lowStockAlert: true,
    lowStockThreshold: 10
  });

  // Sample data
  const [themes] = useState<SystemTheme[]>([
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      accentColor: '#10B981',
      borderRadius: '12px',
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      isDark: false
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      primaryColor: '#818CF8',
      secondaryColor: '#C084FC',
      backgroundColor: '#1F2937',
      textColor: '#F9FAFB',
      accentColor: '#34D399',
      borderRadius: '8px',
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      isDark: true
    },
    {
      id: 'emerald-green',
      name: 'Emerald Green',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      accentColor: '#F59E0B',
      borderRadius: '16px',
      fontSize: '16px',
      fontFamily: 'Inter, sans-serif',
      isDark: false
    }
  ]);

  const [modules, setModules] = useState<Module[]>([
    {
      id: 'pos',
      name: 'Point of Sale',
      description: 'Complete POS system with order management',
      icon: 'CreditCard',
      isEnabled: true,
      permissions: {
        'create-orders': true,
        'edit-orders': true,
        'delete-orders': false,
        'view-reports': true,
        'process-payments': true,
        'manage-discounts': true
      },
      settings: {
        'enable-table-management': true,
        'enable-tips': true,
        'enable-split-payments': true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      description: 'Track stock, manage batches, FIFO/LIFO',
      icon: 'Package',
      isEnabled: true,
      permissions: {
        'view-inventory': true,
        'edit-inventory': true,
        'manage-batches': true,
        'view-reports': true,
        'manage-suppliers': true
      },
      settings: {
        'enable-batch-tracking': true,
        'enable-expiration-alerts': true,
        'enable-low-stock-alerts': true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lodge',
      name: 'Lodge Management',
      description: 'Hotel room management and bookings',
      icon: 'Monitor',
      isEnabled: true,
      permissions: {
        'manage-rooms': true,
        'manage-bookings': true,
        'check-in-out': true,
        'view-reports': true,
        'manage-rates': true
      },
      settings: {
        'enable-online-booking': true,
        'enable-housekeeping': true,
        'enable-maintenance': true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'loan',
      name: 'Credit Management',
      description: 'Customer loans and credit tracking',
      icon: 'DollarSign',
      isEnabled: false,
      permissions: {
        'create-loans': true,
        'manage-payments': true,
        'send-reminders': true,
        'view-reports': true,
        'manage-customers': true
      },
      settings: {
        'enable-sms-reminders': true,
        'enable-email-reminders': true,
        'default-interest-rate': 5
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and configuration',
      permissions: ['*'],
      usersCount: 1,
      color: '#EF4444',
      icon: 'Shield',
      isSystem: true,
      createdAt: new Date()
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manage daily operations and staff',
      permissions: ['pos.*', 'inventory.*', 'reports.view', 'staff.manage'],
      usersCount: 2,
      color: '#F59E0B',
      icon: 'Users',
      isSystem: true,
      createdAt: new Date()
    },
    {
      id: 'cashier',
      name: 'Cashier',
      description: 'Process payments and manage receipts',
      permissions: ['pos.process-payments', 'pos.view-orders', 'receipts.print'],
      usersCount: 2,
      color: '#10B981',
      icon: 'CreditCard',
      isSystem: true,
      createdAt: new Date()
    },
    {
      id: 'waiter',
      name: 'Waiter',
      description: 'Take orders and serve customers',
      permissions: ['pos.create-orders', 'pos.view-orders'],
      usersCount: 5,
      color: '#3B82F6',
      icon: 'Users',
      isSystem: true,
      createdAt: new Date()
    },
    {
      id: 'bartender',
      name: 'Bartender',
      description: 'Prepare drinks and manage bar inventory',
      permissions: ['pos.view-orders', 'inventory.view', 'inventory.consume'],
      usersCount: 3,
      color: '#8B5CF6',
      icon: 'Package',
      isSystem: true,
      createdAt: new Date()
    }
  ]);

  const [receiptTemplates, setReceiptTemplates] = useState<ReceiptTemplate[]>([
    {
      id: 'invoice-template',
      name: 'Standard Invoice',
      type: 'invoice',
      template: `<div class="invoice">
  <h1>{{restaurantName}}</h1>
  <p>Invoice #{{invoiceNumber}}</p>
  <p>Date: {{date}}</p>
  <p>Customer: {{customerName}}</p>
  <table>
    {{#each items}}
    <tr>
      <td>{{name}}</td>
      <td>{{quantity}}</td>
      <td>{{price}}</td>
    </tr>
    {{/each}}
  </table>
  <p>Total: {{total}}</p>
</div>`,
      variables: ['restaurantName', 'invoiceNumber', 'date', 'customerName', 'items', 'total'],
      isEnabled: true,
      isDefault: true,
      preview: 'Invoice template preview...'
    },
    {
      id: 'receipt-template',
      name: 'Payment Receipt',
      type: 'receipt',
      template: `<div class="receipt">
  <h1>{{restaurantName}}</h1>
  <p>Receipt #{{receiptNumber}}</p>
  <p>Date: {{date}}</p>
  <p>Payment Method: {{paymentMethod}}</p>
  <p>Amount: {{amount}}</p>
  <p>Thank you for your visit!</p>
</div>`,
      variables: ['restaurantName', 'receiptNumber', 'date', 'paymentMethod', 'amount'],
      isEnabled: true,
      isDefault: true,
      preview: 'Receipt template preview...'
    }
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveSettings = async (section: string) => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setNotification({ type: 'success', message: `${section} settings saved successfully!` });
    setTimeout(() => setNotification(null), 3000);
  };

  const renderTabIcon = (tab: string) => {
    const icons = {
      general: Settings,
      theme: Palette,
      modules: Package,
      roles: Users,
      receipts: FileText,
      notifications: Bell,
      pos: CreditCard,
      security: Shield
    };
    const Icon = icons[tab as keyof typeof icons] || Settings;
    return <Icon className="w-5 h-5" />;
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'theme', name: 'Theme & Design', icon: Palette },
    { id: 'modules', name: 'Modules', icon: Package },
    { id: 'roles', name: 'Roles & Permissions', icon: Users },
    { id: 'receipts', name: 'Receipts', icon: FileText },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'pos', name: 'POS Settings', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    System Settings
                  </h1>
                  <p className="text-xs text-gray-500">Complete System Configuration</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => saveSettings('All')}
                disabled={saving}
                className={`flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white/90 backdrop-blur border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {renderTabIcon(tab.id)}
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      value={generalSettings.restaurantName}
                      onChange={(e) => setGeneralSettings({...generalSettings, restaurantName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({...generalSettings, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({...generalSettings, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={generalSettings.website}
                      onChange={(e) => setGeneralSettings({...generalSettings, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={generalSettings.address}
                      onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={generalSettings.taxRate}
                      onChange={(e) => setGeneralSettings({...generalSettings, taxRate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('General')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save General Settings
                </button>
              </div>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Theme & Design</h2>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => setCurrentTheme(theme)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        currentTheme.id === theme.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{theme.name}</h4>
                        {currentTheme.id === theme.id && (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className="flex space-x-2 mb-3">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: theme.accentColor }}
                        />
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: theme.backgroundColor }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">
                        {theme.isDark ? '🌙 Dark' : '☀️ Light'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTheme.primaryColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, primaryColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={currentTheme.primaryColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, primaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTheme.secondaryColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, secondaryColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={currentTheme.secondaryColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, secondaryColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTheme.accentColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, accentColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={currentTheme.accentColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, accentColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={currentTheme.backgroundColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, backgroundColor: e.target.value})}
                        className="h-10 w-20 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={currentTheme.backgroundColor}
                        onChange={(e) => setCurrentTheme({...currentTheme, backgroundColor: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Typography</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                    <select
                      value={currentTheme.fontFamily}
                      onChange={(e) => setCurrentTheme({...currentTheme, fontFamily: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                    <select
                      value={currentTheme.fontSize}
                      onChange={(e) => setCurrentTheme({...currentTheme, fontSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="14px">Small (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">Extra Large (20px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                    <select
                      value={currentTheme.borderRadius}
                      onChange={(e) => setCurrentTheme({...currentTheme, borderRadius: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="4px">Small (4px)</option>
                      <option value="8px">Medium (8px)</option>
                      <option value="12px">Large (12px)</option>
                      <option value="16px">Extra Large (16px)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Theme')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Theme Settings
                </button>
              </div>
            </div>
          )}

          {/* Modules Settings */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Modules Management</h2>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module) => (
                  <div key={module.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          module.isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{module.name}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setModules(prev => prev.map(m =>
                            m.id === module.id ? {...m, isEnabled: !m.isEnabled} : m
                          ));
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          module.isEnabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          module.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                        <div className="space-y-2">
                          {Object.entries(module.permissions).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{key}</span>
                              <button
                                onClick={() => {
                                  setModules(prev => prev.map(m =>
                                    m.id === module.id
                                      ? {
                                          ...m,
                                          permissions: {...m.permissions, [key]: !value}
                                        }
                                      : m
                                  ));
                                }}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  value ? 'translate-x-5' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-xs text-gray-500">
                        Created: {module.createdAt.toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        {!module.isSystem && (
                          <button className="p-1 text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Modules')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Module Settings
                </button>
              </div>
            </div>
          )}

          {/* Roles Settings */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <div key={role.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: role.color }}
                        >
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                      {role.isSystem && (
                        <Shield className="w-4 h-4 text-gray-400" title="System Role" />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Users</span>
                        <span className="text-sm font-medium text-gray-900">{role.usersCount}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Permissions</h4>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((permission, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {permission}
                            </span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              +{role.permissions.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-xs text-gray-500">
                        {role.isSystem ? 'System Role' : 'Custom Role'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        {!role.isSystem && (
                          <button className="p-1 text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Roles')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Role Settings
                </button>
              </div>
            </div>
          )}

          {/* Receipts Settings */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Receipt Templates</h2>
                <button className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {receiptTemplates.map((template) => (
                  <div key={template.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">Type: {template.type}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setReceiptTemplates(prev => prev.map(t =>
                              t.id === template.id ? {...t, isEnabled: !t.isEnabled} : t
                            ));
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            template.isEnabled ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            template.isEnabled ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                        <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                          {template.preview}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 hover:text-blue-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 hover:text-green-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-purple-600 hover:text-purple-900">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!template.isDefault && (
                          <button className="text-xs text-blue-600 hover:text-blue-900">
                            Set as Default
                          </button>
                        )}
                        <button className="p-1 text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Receipts')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Receipt Settings
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SMS Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
                    <input
                      type="tel"
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://your-app.com/webhook"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Server</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="number"
                      placeholder="587"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="email"
                      placeholder="your-email@gmail.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Notifications')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* POS Settings */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">POS Configuration</h2>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Settings</h3>
                <div className="space-y-4">
                  {Object.entries(posSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <p className="text-xs text-gray-500">
                          {key === 'enableTableManagement' && 'Allow table selection and management'}
                          {key === 'requireCustomerName' && 'Require customer name for orders'}
                          {key === 'enableTips' && 'Enable tip calculation and options'}
                          {key === 'enableSplitPayments' && 'Allow splitting payments between multiple methods'}
                          {key === 'enableDiscounts' && 'Enable discount application on orders'}
                          {key === 'lowStockAlert' && 'Show alerts when items are low in stock'}
                        </p>
                      </div>
                      {typeof value === 'boolean' ? (
                        <button
                          onClick={() => setPosSettings(prev => ({...prev, [key]: !value}))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      ) : (
                        <input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => setPosSettings(prev => ({
                            ...prev,
                            [key]: typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
                          }))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('POS')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save POS Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Length</label>
                    <input
                      type="number"
                      defaultValue="8"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
                    <input
                      type="number"
                      defaultValue="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Require uppercase letters</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Require lowercase letters</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Require numbers</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Require special characters</span>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Concurrent Sessions</label>
                    <input
                      type="number"
                      defaultValue="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Enable two-factor authentication</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                    <span className="text-sm text-gray-700">Log user activity</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => saveSettings('Security')}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Save Security Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};