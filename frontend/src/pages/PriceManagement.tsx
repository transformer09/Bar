import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  Edit,
  Save,
  X,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Calculator,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Eye,
  Settings,
  Target,
  Zap
} from 'lucide-react';

interface PriceAnalysis {
  id: string;
  inventory_item_id: string;
  item_name: string;
  item_category: string;
  current_average_cost: number;
  current_fifo_cost: number;
  current_lifo_cost: number;
  previous_cost: number;
  cost_change_percentage: number;
  cost_change_amount: number;
  total_batches: number;
  active_batches: number;
  oldest_batch_date: string;
  newest_batch_date: string;
  price_trend: 'increasing' | 'decreasing' | 'stable';
  recommended_action: string;
  impact_on_valuation: number;
  last_updated: string;
}

interface BatchPricing {
  id: string;
  inventory_item_id: string;
  item_name: string;
  batch_number: string;
  unit_cost: number;
  quantity_received: number;
  quantity_available: number;
  total_cost: number;
  current_value: number;
  received_date: string;
  expiration_date?: string;
  supplier_name?: string;
  days_old: number;
  cost_per_unit_available: number;
  utilization_rate: number;
}

interface PriceHistory {
  id: string;
  inventory_item_id: string;
  item_name: string;
  effective_date: string;
  old_price: number;
  new_price: number;
  price_change: number;
  price_change_percentage: number;
  change_reason: string;
  changed_by: string;
  valuation_method: 'fifo' | 'lifo' | 'average_cost';
  affected_batches_count: number;
  total_impact: number;
}

interface PricingRule {
  id: string;
  rule_name: string;
  rule_type: 'markup' | 'margin' | 'target_price';
  rule_value: number;
  applies_to_categories: string[];
  applies_to_suppliers: string[];
  is_active: boolean;
  created_at: string;
  last_applied?: string;
}

export const PriceManagement: React.FC = () => {
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis[]>([]);
  const [batchPricing, setBatchPricing] = useState<BatchPricing[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [selectedItem, setSelectedItem] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [showPriceUpdate, setShowPriceUpdate] = useState(false);
  const [showRuleManager, setShowRuleManager] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceAnalysis | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeReason, setPriceChangeReason] = useState('');
  const [valuationMethod, setValuationMethod] = useState<'fifo' | 'lifo' | 'average_cost'>('average_cost');

  const categories = ['all', 'spirits', 'beer', 'wine', 'mixers', 'food', 'non-alcoholic'];
  const trends = ['all', 'increasing', 'decreasing', 'stable'];

  useEffect(() => {
    fetchPricingData();
  }, [searchTerm, categoryFilter, trendFilter, valuationMethod]);

  const fetchPricingData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      if (trendFilter !== 'all') queryParams.append('trend', trendFilter);
      queryParams.append('valuation_method', valuationMethod);

      const [analysisResponse, batchesResponse, historyResponse, rulesResponse] = await Promise.all([
        fetch(`/api/inventory/price-analysis?${queryParams}`),
        fetch(`/api/inventory/batch-pricing?${queryParams}`),
        fetch(`/api/inventory/price-history?${queryParams}`),
        fetch('/api/inventory/pricing-rules')
      ]);

      const analysisData = await analysisResponse.json();
      const batchesData = await batchesResponse.json();
      const historyData = await historyResponse.json();
      const rulesData = await rulesResponse.json();

      setPriceAnalysis(analysisData);
      setBatchPricing(batchesData);
      setPriceHistory(historyData);
      setPricingRules(rulesData);
    } catch (error) {
      console.error('Failed to fetch pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (itemId: string, newUnitCost: number, reason: string) => {
    try {
      const response = await fetch(`/api/inventory/items/${itemId}/update-cost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_unit_cost: newUnitCost,
          change_reason: reason,
          valuation_method: valuationMethod
        })
      });

      if (response.ok) {
        await fetchPricingData();
        setShowPriceUpdate(false);
        setEditingPrice(null);
        setNewPrice('');
        setPriceChangeReason('');
      }
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  const handleApplyPricingRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/inventory/pricing-rules/${ruleId}/apply`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchPricingData();
      }
    } catch (error) {
      console.error('Failed to apply pricing rule:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return TrendingUp;
      case 'decreasing': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 5) return 'text-red-600';
    if (change > 0) return 'text-orange-600';
    if (change < -5) return 'text-green-600';
    if (change < 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const calculatePotentialImpact = (item: PriceAnalysis, newCost: number) => {
    const currentTotalValue = item.current_average_cost * (item.active_batches * 10); // Estimate
    const newTotalValue = newCost * (item.active_batches * 10);
    return newTotalValue - currentTotalValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Management</h1>
          <p className="text-gray-600">Analyze and manage inventory costs with FIFO/LIFO valuation impact</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Valuation Method:</span>
            <select
              value={valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="fifo">FIFO</option>
              <option value="lifo">LIFO</option>
              <option value="average_cost">Average Cost</option>
            </select>
          </div>
          <button
            onClick={() => setShowRuleManager(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Pricing Rules
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{priceAnalysis.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price Increases</p>
              <p className="text-2xl font-bold text-red-600">
                {priceAnalysis.filter(item => item.price_trend === 'increasing').length}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Price Decreases</p>
              <p className="text-2xl font-bold text-green-600">
                {priceAnalysis.filter(item => item.price_trend === 'decreasing').length}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <TrendingDown className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Change</p>
              <p className={`text-2xl font-bold ${
                priceAnalysis.length > 0 ? getPriceChangeColor(
                  priceAnalysis.reduce((sum, item) => sum + item.cost_change_percentage, 0) / priceAnalysis.length
                ) : 'text-gray-900'
              }`}>
                {priceAnalysis.length > 0 ? formatPercentage(
                  priceAnalysis.reduce((sum, item) => sum + item.cost_change_percentage, 0) / priceAnalysis.length
                ) : '0%'}
              </p>
              <p className="text-xs text-gray-500">Overall trend</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              className="outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={trendFilter}
              onChange={(e) => setTrendFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {trends.map(trend => (
                <option key={trend} value={trend}>
                  {trend.charAt(0).toUpperCase() + trend.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Analysis Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Price Analysis</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {priceAnalysis.map((item) => {
                    const TrendIcon = getTrendIcon(item.price_trend);
                    const currentCost = valuationMethod === 'fifo' ? item.current_fifo_cost :
                                      valuationMethod === 'lifo' ? item.current_lifo_cost :
                                      item.current_average_cost;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                            <div className="text-xs text-gray-500">{item.item_category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(currentCost)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {valuationMethod.toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className={`text-sm font-medium ${getPriceChangeColor(item.cost_change_percentage)}`}>
                              {formatCurrency(item.cost_change_amount)}
                            </div>
                            <div className={`text-xs ${getPriceChangeColor(item.cost_change_percentage)}`}>
                              {formatPercentage(item.cost_change_percentage)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <TrendIcon className={`h-4 w-4 ${getTrendColor(item.price_trend)}`} />
                            <span className={`text-sm capitalize ${getTrendColor(item.price_trend)}`}>
                              {item.price_trend}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.active_batches} / {item.total_batches}
                          </div>
                          <div className="text-xs text-gray-500">active</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPrice(item);
                                setNewPrice(currentCost.toString());
                                setShowPriceUpdate(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="h-4 w-4" />
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

        {/* Selected Item Details */}
        <div className="lg:col-span-1">
          {selectedItem ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Price Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Item</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p className="font-medium text-gray-900">{selectedItem.item_name}</p>
                    <p className="text-sm text-gray-500">{selectedItem.item_category}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Cost Comparison</label>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">FIFO Cost</span>
                      <span className="text-sm font-medium text-green-900">
                        {formatCurrency(selectedItem.current_fifo_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm text-gray-700">LIFO Cost</span>
                      <span className="text-sm font-medium text-yellow-900">
                        {formatCurrency(selectedItem.current_lifo_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm text-gray-700">Average Cost</span>
                      <span className="text-sm font-medium text-purple-900">
                        {formatCurrency(selectedItem.current_average_cost)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Price Trend Analysis</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">30-Day Change</span>
                      <span className={`text-sm font-medium ${getPriceChangeColor(selectedItem.cost_change_percentage)}`}>
                        {formatPercentage(selectedItem.cost_change_percentage)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Impact on Valuation</span>
                      <span className={`text-sm font-medium ${
                        selectedItem.impact_on_valuation >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(Math.abs(selectedItem.impact_on_valuation))}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Batch Information</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Total Batches:</span>
                        <span className="ml-2 font-medium">{selectedItem.total_batches}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active:</span>
                        <span className="ml-2 font-medium">{selectedItem.active_batches}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Oldest:</span>
                        <span className="ml-2 text-xs">
                          {new Date(selectedItem.oldest_batch_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Newest:</span>
                        <span className="ml-2 text-xs">
                          {new Date(selectedItem.newest_batch_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Recommendation</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{selectedItem.recommended_action}</p>
                    </div>
                  </div>
                </div>

                {/* Batch Pricing Breakdown */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Batch Pricing</label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {batchPricing
                      .filter(batch => batch.inventory_item_id === selectedItem.id)
                      .slice(0, 5)
                      .map((batch) => (
                        <div key={batch.id} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium">{batch.batch_number}</span>
                            <span>{formatCurrency(batch.unit_cost)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-gray-500">{batch.quantity_available} available</span>
                            <span className="text-gray-500">{batch.days_old} days old</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select an item to view detailed pricing information</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Update Modal */}
      {showPriceUpdate && editingPrice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Price - {editingPrice.item_name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Cost ({valuationMethod.toUpperCase()})
                </label>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-lg font-medium text-gray-900">
                    {formatCurrency(
                      valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                      valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                      editingPrice.current_average_cost
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Unit Cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter new unit cost"
                />
              </div>

              {newPrice && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800 mb-2">Impact Analysis:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Price Change:</span>
                      <span className={`font-medium ${
                        parseFloat(newPrice) > (
                          valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                          valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                          editingPrice.current_average_cost
                        ) ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(parseFloat(newPrice) - (
                          valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                          valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                          editingPrice.current_average_cost
                        ))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Percentage:</span>
                      <span className={`font-medium ${
                        parseFloat(newPrice) > (
                          valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                          valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                          editingPrice.current_average_cost
                        ) ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatPercentage(
                          ((parseFloat(newPrice) - (
                            valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                            valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                            editingPrice.current_average_cost
                          )) / (
                            valuationMethod === 'fifo' ? editingPrice.current_fifo_cost :
                            valuationMethod === 'lifo' ? editingPrice.current_lifo_cost :
                            editingPrice.current_average_cost
                          )) * 100
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Est. Impact:</span>
                      <span className={`font-medium ${
                        calculatePotentialImpact(editingPrice, parseFloat(newPrice)) >= 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(Math.abs(calculatePotentialImpact(editingPrice, parseFloat(newPrice))))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                <textarea
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Explain the reason for this price change..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPriceUpdate(false);
                  setEditingPrice(null);
                  setNewPrice('');
                  setPriceChangeReason('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePriceUpdate(editingPrice.id, parseFloat(newPrice), priceChangeReason)}
                disabled={!newPrice || parseFloat(newPrice) <= 0 || !priceChangeReason}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Rules Manager Modal */}
      {showRuleManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pricing Rules</h3>
              <button
                onClick={() => setShowRuleManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{rule.rule_name}</h4>
                      <p className="text-sm text-gray-600">
                        {rule.rule_type === 'markup' ? `${rule.rule_value}% markup` :
                         rule.rule_type === 'margin' ? `${rule.rule_value}% margin` :
                         `Target: ${formatCurrency(rule.rule_value)}`}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Categories: {rule.applies_to_categories.join(', ')}</span>
                        {rule.last_applied && (
                          <span>Last applied: {new Date(rule.last_applied).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <button
                        onClick={() => handleApplyPricingRule(rule.id)}
                        disabled={!rule.is_active}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply Rule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRuleManager(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};