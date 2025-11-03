import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Box,
  ShoppingCart,
  User,
  ArrowRight,
  X,
  Save
} from 'lucide-react';

interface Batch {
  id: string;
  inventory_item_id: string;
  item_name: string;
  item_category: string;
  batch_number: string;
  received_date: string;
  unit_cost: number;
  quantity_received: number;
  quantity_available: number;
  quantity_used: number;
  expiration_date?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchase_order_id?: string;
  purchase_order_number?: string;
  notes?: string;
  batch_status: 'active' | 'depleted' | 'expired' | 'suspended';
  days_until_expiry?: number;
  created_at: string;
  updated_at: string;
  total_cost?: number;
  current_value?: number;
}

interface BatchMovement {
  id: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  movement_date: string;
  reference_type?: string;
  reference_id?: string;
  source_location?: string;
  destination_location?: string;
  staff_name?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_email?: string;
  phone?: string;
}

export const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchMovements, setBatchMovements] = useState<BatchMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  // Form state
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    batch_number: '',
    received_date: new Date().toISOString().split('T')[0],
    unit_cost: '',
    quantity_received: '',
    expiration_date: '',
    supplier_id: '',
    purchase_order_id: '',
    notes: ''
  });

  const statuses = ['all', 'active', 'depleted', 'expired', 'suspended'];
  const categories = ['all', 'spirits', 'beer', 'wine', 'mixers', 'food', 'non-alcoholic'];

  useEffect(() => {
    fetchBatches();
    fetchSuppliers();
  }, [searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchMovements();
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);

      const response = await fetch(`/api/inventory/batches?${queryParams}`);
      const data = await response.json();
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchMovements = async () => {
    if (!selectedBatch) return;

    try {
      const response = await fetch(`/api/inventory/batches/${selectedBatch.id}/movements`);
      const data = await response.json();
      setBatchMovements(data);
    } catch (error) {
      console.error('Failed to fetch batch movements:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const handleCreateBatch = async () => {
    try {
      const batchData = {
        ...formData,
        unit_cost: parseFloat(formData.unit_cost),
        quantity_received: parseFloat(formData.quantity_received),
        supplier_id: formData.supplier_id || null,
        purchase_order_id: formData.purchase_order_id || null,
        expiration_date: formData.expiration_date || null
      };

      const response = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      });

      if (response.ok) {
        await fetchBatches();
        setShowCreateBatch(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create batch:', error);
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    try {
      const updateData = {
        notes: formData.notes,
        batch_status: formData.status || editingBatch.batch_status
      };

      const response = await fetch(`/api/inventory/batches/${editingBatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchBatches();
        setEditingBatch(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update batch:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      inventory_item_id: '',
      batch_number: '',
      received_date: new Date().toISOString().split('T')[0],
      unit_cost: '',
      quantity_received: '',
      expiration_date: '',
      supplier_id: '',
      purchase_order_id: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'depleted': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  const getUtilizationRate = (batch: Batch) => {
    return ((batch.quantity_used / batch.quantity_received) * 100).toFixed(1);
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
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-gray-600">Track and manage inventory batches with detailed cost and expiration tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowCreateBatch(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
            </div>
            <Box className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Batches</p>
              <p className="text-2xl font-bold text-green-600">
                {batches.filter(b => b.batch_status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">
                {batches.filter(b => b.days_until_expiry !== undefined && b.days_until_expiry > 0 && b.days_until_expiry <= 30).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(batches.reduce((sum, b) => sum + (b.current_value || 0), 0))}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
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
              placeholder="Search batches..."
              className="outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batches List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Inventory Batches</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => {
                    const expirationStatus = getExpirationStatus(batch);
                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedBatch(batch)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Box className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(batch.received_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{batch.item_name}</div>
                            <div className="text-xs text-gray-500">{batch.item_category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(batch.batch_status)}`}>
                            {batch.batch_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {batch.quantity_available} / {batch.quantity_received}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getUtilizationRate(batch)}% used
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{formatCurrency(batch.current_value || (batch.quantity_available * batch.unit_cost))}</div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(batch.unit_cost)}/unit
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expirationStatus ? (
                            <div className="flex items-center">
                              <expirationStatus.icon className={`h-4 w-4 mr-1 ${expirationStatus.color}`} />
                              <span className={`text-sm ${expirationStatus.color}`}>
                                {expirationStatus.text}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No expiration</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatch(batch);
                                setViewMode('details');
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBatch(batch);
                                setFormData({
                                  ...formData,
                                  inventory_item_id: batch.inventory_item_id,
                                  batch_number: batch.batch_number,
                                  received_date: batch.received_date.split('T')[0],
                                  unit_cost: batch.unit_cost.toString(),
                                  quantity_received: batch.quantity_received.toString(),
                                  expiration_date: batch.expiration_date || '',
                                  supplier_id: batch.supplier_id || '',
                                  purchase_order_id: batch.purchase_order_id || '',
                                  notes: batch.notes || ''
                                });
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
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

        {/* Batch Details */}
        <div className="lg:col-span-1">
          {selectedBatch ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Batch Details</h3>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Batch Number</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBatch.batch_number}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Item</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBatch.item_name}</p>
                  <p className="text-xs text-gray-500">{selectedBatch.item_category}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Received</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedBatch.received_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedBatch.batch_status)}`}>
                        {selectedBatch.batch_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Unit Cost</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedBatch.unit_cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Total Cost</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(selectedBatch.quantity_received * selectedBatch.unit_cost)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {selectedBatch.quantity_available} of {selectedBatch.quantity_received}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getUtilizationRate(selectedBatch)}% used
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${getUtilizationRate(selectedBatch)}%` }}
                    ></div>
                  </div>
                </div>

                {selectedBatch.expiration_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Expiration</label>
                    <div className="mt-1 flex items-center">
                      {getExpirationStatus(selectedBatch) && (
                        <>
                          <getExpirationStatus(selectedBatch)!.icon className={`h-4 w-4 mr-2 ${getExpirationStatus(selectedBatch)!.color}`} />
                          <span className={`text-sm ${getExpirationStatus(selectedBatch)!.color}`}>
                            {new Date(selectedBatch.expiration_date).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedBatch.supplier_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Supplier</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.supplier_name}</p>
                  </div>
                )}

                {selectedBatch.purchase_order_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Purchase Order</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.purchase_order_number}</p>
                  </div>
                )}

                {selectedBatch.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.notes}</p>
                  </div>
                )}

                {/* Recent Movements */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Recent Movements</label>
                  <div className="mt-2 space-y-2">
                    {batchMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${
                            movement.movement_type === 'restock' ? 'bg-green-100' :
                            movement.movement_type === 'usage' ? 'bg-red-100' : 'bg-yellow-100'
                          }`}>
                            {movement.movement_type === 'restock' ? <Plus className="h-3 w-3 text-green-600" /> :
                             movement.movement_type === 'usage' ? <Minus className="h-3 w-3 text-red-600" /> :
                             <BarChart3 className="h-3 w-3 text-yellow-600" />}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 capitalize">{movement.movement_type}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(movement.movement_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Box className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a batch to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Batch</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., VOD-750ML-20241025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                <input
                  type="date"
                  value={formData.received_date}
                  onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="15.50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity_received}
                  onChange={(e) => setFormData({...formData, quantity_received: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (Optional)</label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Order (Optional)</label>
                <input
                  type="text"
                  value={formData.purchase_order_id}
                  onChange={(e) => setFormData({...formData, purchase_order_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="PO-12345"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Add any notes about this batch..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateBatch(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                disabled={!formData.batch_number || !formData.unit_cost || !formData.quantity_received}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Batch</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Add notes about this batch..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status || editingBatch.batch_status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="depleted">Depleted</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingBatch(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};