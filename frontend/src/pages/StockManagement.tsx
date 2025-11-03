import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Eye,
  Edit,
  Save,
  X,
  BarChart3,
  ArrowRight,
  Zap,
  Box
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  unit: string;
  valuation_method: 'fifo' | 'lifo' | 'average_cost';
  current_fifo_value: number;
  current_lifo_value: number;
  current_average_cost: number;
  reorder_point: number;
  max_stock_level: number;
  total_batches_count: number;
  supplier_name?: string;
  last_updated: string;
  batches?: Batch[];
}

interface Batch {
  id: string;
  batch_number: string;
  received_date: string;
  unit_cost: number;
  quantity_received: number;
  quantity_available: number;
  quantity_used: number;
  expiration_date?: string;
  supplier_name?: string;
  batch_status: 'active' | 'depleted' | 'expired' | 'suspended';
  days_until_expiry?: number;
}

interface StockMovement {
  id: string;
  movement_type: 'restock' | 'usage' | 'adjustment' | 'transfer' | 'waste';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  movement_date: string;
  reference_type?: string;
  notes?: string;
  batch_number?: string;
}

export const StockManagement: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddStock, setShowAddStock] = useState(false);
  const [showUseStock, setShowUseStock] = useState(false);
  const [valuationMethod, setValuationMethod] = useState<'fifo' | 'lifo' | 'average'>('fifo');
  const [quantityToMove, setQuantityToMove] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [notes, setNotes] = useState('');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  const categories = ['all', 'spirits', 'beer', 'wine', 'mixers', 'food', 'non-alcoholic'];

  useEffect(() => {
    fetchStockItems();
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (selectedItem) {
      fetchBatches();
      fetchMovements();
    }
  }, [selectedItem]);

  const fetchStockItems = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedCategory !== 'all') queryParams.append('category', selectedCategory);

      const response = await fetch(`/api/inventory/items?${queryParams}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/inventory/items/${selectedItem.id}/batches`);
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchMovements = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/inventory/items/${selectedItem.id}/movements?limit=20`);
      const data = await response.json();
      setMovements(data);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    }
  };

  const handleStockMovement = async (movementType: 'restock' | 'usage' | 'adjustment') => {
    if (!selectedItem || !quantityToMove) return;

    try {
      const movementData = {
        inventory_item_id: selectedItem.id,
        quantity_change: movementType === 'restock' ? parseFloat(quantityToMove) : -parseFloat(quantityToMove),
        valuation_method: valuationMethod,
        reference_type: 'manual_adjustment',
        notes: notes || `${movementType} via stock management`,
        batch_id: selectedBatch?.id
      };

      const response = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData)
      });

      if (response.ok) {
        await fetchStockItems();
        if (selectedItem) {
          await fetchBatches();
          await fetchMovements();
        }
        setShowAddStock(false);
        setShowUseStock(false);
        setQuantityToMove('');
        setSelectedBatch(null);
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to process stock movement:', error);
    }
  };

  const handleValuationMethodChange = async (method: 'fifo' | 'lifo' | 'average_cost') => {
    if (!selectedItem) return;

    try {
      const response = await fetch(`/api/inventory/items/${selectedItem.id}/valuation-method`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valuation_method: method })
      });

      if (response.ok) {
        await fetchStockItems();
        setSelectedItem({ ...selectedItem, valuation_method: method });
      }
    } catch (error) {
      console.error('Failed to update valuation method:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBatchStatusColor = (batch: Batch) => {
    switch (batch.batch_status) {
      case 'active': return 'text-green-600';
      case 'depleted': return 'text-gray-600';
      case 'expired': return 'text-red-600';
      case 'suspended': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getExpirationStatus = (batch: Batch) => {
    if (!batch.expiration_date) return null;
    if (batch.days_until_expiry !== undefined) {
      if (batch.days_until_expiry < 0) return { color: 'text-red-600', icon: AlertTriangle, text: 'Expired' };
      if (batch.days_until_expiry <= 7) return { color: 'text-orange-600', icon: AlertTriangle, text: `${batch.days_until_expiry} days` };
      if (batch.days_until_expiry <= 30) return { color: 'text-yellow-600', icon: Clock, text: `${batch.days_until_expiry} days` };
      return { color: 'text-green-600', icon: CheckCircle, text: `${batch.days_until_expiry} days` };
    }
    return null;
  };

  const getSelectedBatchesForMovement = () => {
    if (valuationMethod === 'fifo') {
      return [...batches]
        .filter(b => b.batch_status === 'active' && b.quantity_available > 0)
        .sort((a, b) => new Date(a.received_date).getTime() - new Date(b.received_date).getTime());
    } else if (valuationMethod === 'lifo') {
      return [...batches]
        .filter(b => b.batch_status === 'active' && b.quantity_available > 0)
        .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
    }
    return batches.filter(b => b.batch_status === 'active' && b.quantity_available > 0);
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
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Manage stock movements with FIFO/LIFO logic</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddStock(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={!selectedItem}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </button>
          <button
            onClick={() => setShowUseStock(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            disabled={!selectedItem}
          >
            <Minus className="h-4 w-4 mr-2" />
            Use Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="flex-1 outline-none text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.map((item) => {
                const stockStatus = item.current_stock <= item.reorder_point ? 'critical' :
                                   item.current_stock <= item.reorder_point * 1.5 ? 'warning' : 'good';
                const StatusIcon = stockStatus === 'critical' ? AlertTriangle :
                                  stockStatus === 'warning' ? TrendingDown : CheckCircle;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                          <StatusIcon className={`h-4 w-4 ${
                            stockStatus === 'critical' ? 'text-red-600' :
                            stockStatus === 'warning' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-sm font-medium ${
                            stockStatus === 'critical' ? 'text-red-600' :
                            stockStatus === 'warning' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {item.current_stock} {item.unit}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(item.current_fifo_value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Item Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedItem ? (
            <>
              {/* Item Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{selectedItem.name}</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Valuation:</span>
                    <select
                      value={selectedItem.valuation_method}
                      onChange={(e) => handleValuationMethodChange(e.target.value as any)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="fifo">FIFO</option>
                      <option value="lifo">LIFO</option>
                      <option value="average_cost">Average Cost</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current Stock</p>
                    <p className="text-xl font-bold text-gray-900">{selectedItem.current_stock}</p>
                    <p className="text-xs text-gray-500">{selectedItem.unit}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">FIFO Value</p>
                    <p className="text-lg font-bold text-green-900">{formatCurrency(selectedItem.current_fifo_value)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(selectedItem.current_fifo_value / selectedItem.current_stock)}/{selectedItem.unit}</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">LIFO Value</p>
                    <p className="text-lg font-bold text-yellow-900">{formatCurrency(selectedItem.current_lifo_value)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(selectedItem.current_lifo_value / selectedItem.current_stock)}/{selectedItem.unit}</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Avg Cost</p>
                    <p className="text-lg font-bold text-purple-900">{formatCurrency(selectedItem.current_average_cost)}</p>
                    <p className="text-xs text-gray-500">per {selectedItem.unit}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-900">Valuation Difference (LIFO vs FIFO)</span>
                    <span className={`font-bold ${selectedItem.current_lifo_value >= selectedItem.current_fifo_value ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedItem.current_lifo_value >= selectedItem.current_fifo_value ? '+' : ''}
                      {formatCurrency(selectedItem.current_lifo_value - selectedItem.current_fifo_value)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Batches */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Active Batches ({batches.filter(b => b.batch_status === 'active').length})</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {getSelectedBatchesForMovement().map((batch) => {
                      const expirationStatus = getExpirationStatus(batch);
                      return (
                        <div key={batch.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Box className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-gray-900">{batch.batch_number}</span>
                                {expirationStatus && (
                                  <div className="flex items-center space-x-1">
                                    <expirationStatus.icon className={`h-3 w-3 ${expirationStatus.color}`} />
                                    <span className={`text-xs ${expirationStatus.color}`}>{expirationStatus.text}</span>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Received:</span>
                                  <span className="ml-2 text-gray-900">{new Date(batch.received_date).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Cost:</span>
                                  <span className="ml-2 text-gray-900">{formatCurrency(batch.unit_cost)}/{selectedItem.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Available:</span>
                                  <span className="ml-2 font-medium text-green-600">{batch.quantity_available} {selectedItem.unit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Used:</span>
                                  <span className="ml-2 text-gray-900">{batch.quantity_used} {selectedItem.unit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Movements */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Movements</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {movements.slice(0, 10).map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded ${
                            movement.movement_type === 'restock' ? 'bg-green-100' :
                            movement.movement_type === 'usage' ? 'bg-red-100' :
                            movement.movement_type === 'adjustment' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            {movement.movement_type === 'restock' ? <Plus className="h-3 w-3 text-green-600" /> :
                             movement.movement_type === 'usage' ? <Minus className="h-3 w-3 text-red-600" /> :
                             movement.movement_type === 'adjustment' ? <Zap className="h-3 w-3 text-yellow-600" /> :
                             <BarChart3 className="h-3 w-3 text-gray-600" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">{movement.movement_type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.movement_date).toLocaleDateString()}
                              {movement.batch_number && ` • ${movement.batch_number}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity} {selectedItem.unit}
                          </p>
                          <p className="text-xs text-gray-500">{formatCurrency(Math.abs(movement.total_cost))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select an item to view details and manage stock</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddStock && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Stock - {selectedItem.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valuation Method</label>
                <select
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="fifo">FIFO (First In, First Out)</option>
                  <option value="lifo">LIFO (Last In, First Out)</option>
                  <option value="average">Average Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantityToMove}
                  onChange={(e) => setQuantityToMove(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={`Enter quantity in ${selectedItem.unit}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Add notes about this stock movement..."
                />
              </div>

              {valuationMethod === 'fifo' && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>FIFO Mode:</strong> Stock will be used in the order it was received (oldest first)
                  </p>
                </div>
              )}

              {valuationMethod === 'lifo' && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>LIFO Mode:</strong> Stock will be used in reverse order (newest first)
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddStock(false);
                  setQuantityToMove('');
                  setNotes('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStockMovement('restock')}
                disabled={!quantityToMove || parseFloat(quantityToMove) <= 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Use Stock Modal */}
      {showUseStock && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Use Stock - {selectedItem.name}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valuation Method</label>
                <select
                  value={valuationMethod}
                  onChange={(e) => setValuationMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="fifo">FIFO (First In, First Out)</option>
                  <option value="lifo">LIFO (Last In, First Out)</option>
                  <option value="average">Average Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Use</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedItem.current_stock}
                  value={quantityToMove}
                  onChange={(e) => setQuantityToMove(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={`Enter quantity in ${selectedItem.unit}`}
                />
                <p className="text-xs text-gray-500 mt-1">Available: {selectedItem.current_stock} {selectedItem.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Add notes about this stock movement..."
                />
              </div>

              {valuationMethod === 'fifo' && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>FIFO Mode:</strong> Will use oldest stock first for consistent quality
                  </p>
                </div>
              )}

              {valuationMethod === 'lifo' && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>LIFO Mode:</strong> Will use newest stock first (may affect pricing)
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUseStock(false);
                  setQuantityToMove('');
                  setNotes('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStockMovement('usage')}
                disabled={!quantityToMove || parseFloat(quantityToMove) <= 0 || parseFloat(quantityToMove) > selectedItem.current_stock}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};