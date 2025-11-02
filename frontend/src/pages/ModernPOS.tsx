import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  Receipt,
  User,
  Clock,
  CheckCircle,
  X,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Coffee,
  Wine,
  Beer,
  Utensils,
  ShoppingCart,
  Printer,
  Send,
  Bell,
  AlertCircle,
  ChevronRight,
  Grid,
  List,
  Filter,
  Tag,
  Percent,
  Heart,
  Zap,
  Target,
  Eye
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  inStock: boolean;
  preparationTime: number;
  allergens?: string[];
  isPopular?: boolean;
  rating?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  customizations?: Record<string, any>;
}

interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timestamp: Date;
  waiterId: string;
  waiterName: string;
  specialInstructions?: string;
  paymentStatus: 'pending' | 'partial' | 'paid';
  paymentMethod?: 'cash' | 'card' | 'mobile';
}

interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  capacity: number;
  currentOrder?: Order;
  waiterId?: string;
  waiterName?: string;
  occupiedSince?: Date;
  estimatedBill?: number;
}

export const ModernPOS: React.FC = () => {
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sample data
  const categories = [
    { id: 'all', name: 'All Items', icon: Grid, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'spirits', name: 'Spirits', icon: Wine, color: 'bg-gradient-to-r from-amber-500 to-orange-500' },
    { id: 'beer', name: 'Beer', icon: Beer, color: 'bg-gradient-to-r from-yellow-500 to-amber-500' },
    { id: 'cocktails', name: 'Cocktails', icon: Coffee, color: 'bg-gradient-to-r from-pink-500 to-rose-500' },
    { id: 'food', name: 'Food', icon: Utensils, color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 'soft-drinks', name: 'Soft Drinks', icon: Smartphone, color: 'bg-gradient-to-r from-blue-500 to-cyan-500' }
  ];

  const menuItems: MenuItem[] = [
    // Spirits
    { id: '1', name: 'Johnnie Walker Black', category: 'spirits', price: 45.00, description: '12 year old blended scotch whiskey', inStock: true, preparationTime: 2, isPopular: true, rating: 4.5 },
    { id: '2', name: 'Grey Goose Vodka', category: 'spirits', price: 38.00, description: 'Premium French vodka', inStock: true, preparationTime: 2, rating: 4.3 },
    { id: '3', name: 'Bacardi Superior', category: 'spirits', price: 28.00, description: 'Premium white rum', inStock: true, preparationTime: 2 },

    // Beer
    { id: '4', name: 'Heineken', category: 'beer', price: 12.00, description: 'Imported Dutch lager', inStock: true, preparationTime: 1, isPopular: true, rating: 4.2 },
    { id: '5', name: 'Guinness Draught', category: 'beer', price: 14.00, description: 'Irish dry stout', inStock: true, preparationTime: 1, rating: 4.4 },
    { id: '6', name: 'Budweiser', category: 'beer', price: 10.00, description: 'American lager', inStock: true, preparationTime: 1 },

    // Cocktails
    { id: '7', name: 'Mojito', category: 'cocktails', price: 18.00, description: 'Rum, mint, lime, sugar, soda', inStock: true, preparationTime: 5, isPopular: true, rating: 4.6 },
    { id: '8', name: 'Margarita', category: 'cocktails', price: 16.00, description: 'Tequila, lime, triple sec', inStock: true, preparationTime: 4, rating: 4.5 },
    { id: '9', name: 'Old Fashioned', category: 'cocktails', price: 22.00, description: 'Bourbon, sugar, bitters, orange', inStock: true, preparationTime: 6, rating: 4.7 },

    // Food
    { id: '10', name: 'Classic Burger', category: 'food', price: 25.00, description: 'Beef patty, lettuce, tomato, cheese', inStock: true, preparationTime: 15, isPopular: true, rating: 4.4 },
    { id: '11', name: 'Caesar Salad', category: 'food', price: 18.00, description: 'Romaine, parmesan, croutons', inStock: true, preparationTime: 8, rating: 4.2 },
    { id: '12', name: 'Chicken Wings', category: 'food', price: 20.00, description: '6 pieces, choice of sauce', inStock: true, preparationTime: 12, rating: 4.3 },

    // Soft Drinks
    { id: '13', name: 'Coca Cola', category: 'soft-drinks', price: 6.00, description: 'Classic cola', inStock: true, preparationTime: 1, rating: 4.0 },
    { id: '14', name: 'Orange Juice', category: 'soft-drinks', price: 8.00, description: 'Fresh squeezed orange juice', inStock: true, preparationTime: 3, rating: 4.1 },
    { id: '15', name: 'Lemonade', category: 'soft-drinks', price: 7.00, description: 'Fresh lemonade with mint', inStock: true, preparationTime: 2, rating: 4.2 }
  ];

  const tables: Table[] = [
    { id: '1', number: 'T1', status: 'available', capacity: 4 },
    { id: '2', number: 'T2', status: 'occupied', capacity: 2, currentOrder: undefined, waiterId: 'waiter1', waiterName: 'John Doe', occupiedSince: new Date(), estimatedBill: 125.50 },
    { id: '3', number: 'T3', status: 'occupied', capacity: 6, currentOrder: undefined, waiterId: 'waiter2', waiterName: 'Jane Smith', occupiedSince: new Date(), estimatedBill: 280.75 },
    { id: '4', number: 'T4', status: 'reserved', capacity: 4 },
    { id: '5', number: 'T5', status: 'available', capacity: 2 },
    { id: '6', number: 'T6', status: 'occupied', capacity: 4, currentOrder: undefined, waiterId: 'waiter1', waiterName: 'John Doe', occupiedSince: new Date(), estimatedBill: 95.00 },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    if (!item.inStock) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const placeOrder = () => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax,
      total,
      tableNumber: selectedTable?.number,
      customerName,
      orderType,
      status: 'pending',
      timestamp: new Date(),
      waiterId: 'waiter1',
      waiterName: 'John Doe',
      paymentStatus: 'pending'
    };

    // Send order to kitchen/bar
    console.log('Order placed:', order);

    // Clear cart
    setCart([]);
    setSelectedTable(null);
    setCustomerName('');

    // Show success notification
    setShowNotifications(true);
    setTimeout(() => setShowNotifications(false), 3000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cleaning': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    POS System
                  </h1>
                  <p className="text-xs text-gray-500">Modern Bar Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Today's Sales</p>
                  <p className="text-lg font-bold text-green-600">$3,847</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-bold text-blue-600">124</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Active Tables</p>
                  <p className="text-lg font-bold text-purple-600">8/12</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                >
                  <Zap className="w-5 h-5" />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="absolute top-20 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-80 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
              <Eye className="w-5 h-5 mx-auto mb-1" />
              View Orders
            </button>
            <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm">
              <Receipt className="w-5 h-5 mx-auto mb-1" />
              Today's Report
            </button>
            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm">
              <Users className="w-5 h-5 mx-auto mb-1" />
              Staff
            </button>
            <button className="p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm">
              <Target className="w-5 h-5 mx-auto mb-1" />
              Targets
            </button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Side - Menu */}
          <div className="flex-1 lg:flex-[2] p-4 overflow-y-auto">
            {/* Search and Categories */}
            <div className="mb-4 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all transform hover:scale-105 ${
                        selectedCategory === category.id
                          ? `${category.color} text-white shadow-lg`
                          : 'bg-white/80 backdrop-blur text-gray-700 hover:bg-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium whitespace-nowrap">{category.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
                <div className="flex items-center space-x-2 bg-white/80 backdrop-blur rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('grid')}
                    className={`p-2 rounded ${activeView === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveView('list')}
                    className={`p-2 rounded ${activeView === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className={activeView === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-2'}>
              {filteredMenuItems.map((item) => {
                const isInCart = cart.some(cartItem => cartItem.id === item.id);
                const cartItem = cart.find(cartItem => cartItem.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white/90 backdrop-blur rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-gray-100 ${
                      !item.inStock ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        {item.isPopular && (
                          <div className="flex items-center space-x-1 bg-gradient-to-r from-orange-400 to-red-500 text-white px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-medium">Popular</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(item.price)}
                          </span>
                          {item.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{item.rating}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {item.preparationTime && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">{item.preparationTime}m</span>
                            </div>
                          )}

                          {isInCart && cartItem ? (
                            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-2 font-semibold text-gray-900">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={!item.inStock}
                              className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side - Cart and Order */}
          <div className="lg:w-96 bg-white/90 backdrop-blur border-l border-gray-200 flex flex-col">
            {/* Order Details */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h2>

              {/* Order Type Selection */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['dine-in', 'takeaway', 'delivery'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      orderType === type
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </button>
                ))}
              </div>

              {/* Customer Name */}
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Table Selection */}
              {orderType === 'dine-in' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Table</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tables.map((table) => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        disabled={table.status === 'occupied' && table.waiterId !== 'waiter1'}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          selectedTable?.id === table.id
                            ? 'border-blue-500 bg-blue-50'
                            : table.status === 'occupied'
                            ? 'border-red-200 bg-red-50 cursor-not-allowed'
                            : table.status === 'reserved'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <p className="font-semibold text-sm">{table.number}</p>
                          <p className="text-xs text-gray-500">{table.capacity} seats</p>
                          <p className={`text-xs mt-1 px-1 py-0.5 rounded ${getTableStatusColor(table.status)}`}>
                            {table.status}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cart</h3>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-2 font-semibold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-medium">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowInvoice(true)}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                  >
                    <Receipt className="w-4 h-4 inline mr-2" />
                    Create Invoice
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
                  >
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Quick Pay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showNotifications && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          <span>Order sent to kitchen successfully!</span>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Invoice</h3>
              <button
                onClick={() => setShowInvoice(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h4 className="font-bold text-lg text-gray-900">Bar & Restaurant</h4>
                <p className="text-sm text-gray-600">Modern POS System</p>
                <p className="text-xs text-gray-500 mt-1">Invoice #INV-{Date.now()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{customerName || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">{selectedTable?.number || orderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waiter:</span>
                  <span className="font-medium">John Doe</span>
                </div>
              </div>

              <div className="border-t pt-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    placeOrder();
                    setShowInvoice(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Send Order
                </button>
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payment</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(total)}</p>
                <p className="text-sm text-gray-600 mt-1">Total Amount</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">Card</p>
                </button>
                <button className="p-4 border-2 border-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">Cash</p>
                </button>
                <button className="p-4 border-2 border-purple-500 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium">Mobile</p>
                </button>
                <button className="p-4 border-2 border-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                  <Percent className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm font-medium">Split</p>
                </button>
              </div>

              <button
                onClick={() => {
                  placeOrder();
                  setShowPayment(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};