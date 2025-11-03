import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Activity,
  RefreshCw,
  Filter,
  Eye,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Trash2
} from 'lucide-react';

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringSoon: number;
  fifoValue: number;
  lifoValue: number;
  averageValue: number;
  valuationDifference: number;
  recentMovements: any[];
  criticalAlerts: any[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  current_fifo_value: number;
  current_lifo_value: number;
  current_average_cost: number;
  valuation_method: 'fifo' | 'lifo' | 'average_cost';
  reorder_point: number;
  max_stock_level: number;
  supplier_name?: string;
  last_updated: string;
}

export const InventoryDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'valuation' | 'movements'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', 'spirits', 'beer', 'wine', 'mixers', 'food', 'non-alcoholic'];

  useEffect(() => {
    fetchInventoryData();
  }, [selectedCategory]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch metrics
      const metricsResponse = await fetch('/api/inventory/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch items
      const itemsResponse = await fetch(`/api/inventory/items${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`);
      const itemsData = await itemsResponse.json();
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventoryData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.current_stock <= item.reorder_point) return 'text-red-600';
    if (item.current_stock <= item.reorder_point * 1.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusIcon = (item: InventoryItem) => {
    if (item.current_stock <= item.reorder_point) return AlertTriangle;
    if (item.current_stock <= item.reorder_point * 1.5) return TrendingDown;
    return TrendingUp;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading inventory data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Real-time inventory tracking with FIFO/LIFO valuation</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value (FIFO)</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.fifoValue)}</p>
                {metrics.valuationDifference !== 0 && (
                  <div className="flex items-center mt-1">
                    {metrics.valuationDifference > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${metrics.valuationDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(metrics.valuationDifference))} vs LIFO
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{metrics.lowStockItems}</p>
                <p className="text-sm text-gray-500">Need reorder</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.expiringSoon}</p>
                <p className="text-sm text-gray-500">Within 30 days</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'valuation', 'movements'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                viewMode === mode
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Inventory Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FIFO Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valuation Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const StatusIcon = getStockStatusIcon(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            {item.supplier_name && (
                              <div className="text-sm text-gray-500">{item.supplier_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${getStockStatusColor(item)}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {item.current_stock} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.current_fifo_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.valuation_method === 'fifo' ? 'bg-green-100 text-green-800' :
                          item.valuation_method === 'lifo' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.valuation_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StatusIcon className={`h-4 w-4 mr-1 ${getStockStatusColor(item)}`} />
                          <span className={`text-sm ${getStockStatusColor(item)}`}>
                            {item.current_stock <= item.reorder_point ? 'Low Stock' :
                             item.current_stock <= item.reorder_point * 1.5 ? 'Reorder Soon' : 'In Stock'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Plus className="h-4 w-4" />
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
      )}

      {viewMode === 'valuation' && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valuation Comparison</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">FIFO Method</p>
                  <p className="text-sm text-green-700">First In, First Out</p>
                </div>
                <p className="text-xl font-bold text-green-900">{formatCurrency(metrics.fifoValue)}</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-yellow-900">LIFO Method</p>
                  <p className="text-sm text-yellow-700">Last In, First Out</p>
                </div>
                <p className="text-xl font-bold text-yellow-900">{formatCurrency(metrics.lifoValue)}</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-purple-900">Average Cost</p>
                  <p className="text-sm text-purple-700">Weighted Average</p>
                </div>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(metrics.averageValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Valuation Impact Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">LIFO vs FIFO Difference</p>
                <p className={`text-2xl font-bold ${metrics.valuationDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.valuationDifference >= 0 ? '+' : ''}{formatCurrency(metrics.valuationDifference)}
                </p>
                <p className="text-sm text-gray-500">
                  {metrics.valuationDifference >= 0 ? 'LIFO results in higher valuation' : 'FIFO results in higher valuation'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-2">Valuation Method Recommendation</p>
                <p className="font-medium text-blue-900">
                  {metrics.valuationDifference > 0 ?
                    'LIFO is recommended for higher inventory valuation (useful for collateral purposes)' :
                    'FIFO is recommended for more conservative valuation'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'movements' && metrics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Stock Movements</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics.recentMovements.length > 0 ? (
                metrics.recentMovements.map((movement: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Activity className={`h-5 w-5 ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{movement.item_name}</p>
                        <p className="text-sm text-gray-500">{movement.movement_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(movement.movement_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent movements found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};