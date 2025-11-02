import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Calendar,
  Bell,
  BellOff,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  X,
  Check,
  Settings,
  Mail,
  Smartphone,
  BarChart3
} from 'lucide-react';

interface ExpirationAlert {
  id: string;
  inventory_item_id: string;
  item_name: string;
  item_category: string;
  batch_id: string;
  batch_number: string;
  alert_type: 'warning' | 'critical' | 'expired' | 'disposed';
  alert_date: string;
  expiration_date: string;
  days_until_expiry: number;
  quantity_affected: number;
  unit: string;
  estimated_waste_value: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  notification_sent: boolean;
  notification_date?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  id: string;
  alert_type: 'warning' | 'critical' | 'expired';
  days_before: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  recipient_emails: string[];
  recipient_phones: string[];
}

interface ExpirationMetrics {
  totalActiveAlerts: number;
  criticalAlerts: number;
  expiredItems: number;
  estimatedWasteValue: number;
  itemsExpiringThisWeek: number;
  itemsExpiringThisMonth: number;
  recentlyResolved: number;
  notificationsSent: number;
}

export const ExpirationTracking: React.FC = () => {
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ExpirationAlert | null>(null);
  const [metrics, setMetrics] = useState<ExpirationMetrics | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const alertTypes = ['all', 'warning', 'critical', 'expired', 'disposed'];
  const statuses = ['all', 'active', 'acknowledged', 'resolved', 'dismissed'];
  const timeFilters = ['all', 'today', 'week', 'month', 'quarter'];

  useEffect(() => {
    fetchExpirationData();
  }, [searchTerm, statusFilter, alertTypeFilter, timeFilter]);

  const fetchExpirationData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (alertTypeFilter !== 'all') queryParams.append('alert_type', alertTypeFilter);
      if (timeFilter !== 'all') queryParams.append('time_filter', timeFilter);

      const [alertsResponse, metricsResponse, settingsResponse] = await Promise.all([
        fetch(`/api/inventory/expiration-alerts?${queryParams}`),
        fetch('/api/inventory/expiration-metrics'),
        fetch('/api/inventory/notification-settings')
      ]);

      const alertsData = await alertsResponse.json();
      const metricsData = await metricsResponse.json();
      const settingsData = await settingsResponse.json();

      setAlerts(alertsData);
      setMetrics(metricsData);
      setNotificationSettings(settingsData);
    } catch (error) {
      console.error('Failed to fetch expiration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExpirationData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/expiration-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Acknowledged via dashboard' })
      });

      if (response.ok) {
        await fetchExpirationData();
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(null);
        }
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string, resolutionNotes: string) => {
    try {
      const response = await fetch(`/api/inventory/expiration-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes: resolutionNotes })
      });

      if (response.ok) {
        await fetchExpirationData();
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(null);
        }
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/expiration-alerts/${alertId}/dismiss`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchExpirationData();
        if (selectedAlert?.id === alertId) {
          setSelectedAlert(null);
        }
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleBulkAction = async (action: 'acknowledge' | 'resolve' | 'dismiss') => {
    try {
      const response = await fetch('/api/inventory/expiration-alerts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: selectedAlerts, action })
      });

      if (response.ok) {
        await fetchExpirationData();
        setSelectedAlerts([]);
        setShowBulkActions(false);
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-red-800 bg-red-200';
      case 'disposed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'warning': return AlertTriangle;
      case 'critical': return AlertCircle;
      case 'expired': return Trash2;
      case 'disposed': return CheckCircle;
      default: return Bell;
    }
  };

  const getExpirationUrgency = (daysUntil: number) => {
    if (daysUntil < 0) return { color: 'text-red-600', label: 'Expired', priority: 'high' };
    if (daysUntil <= 3) return { color: 'text-red-600', label: 'Critical', priority: 'high' };
    if (daysUntil <= 7) return { color: 'text-orange-600', label: 'Urgent', priority: 'medium' };
    if (daysUntil <= 30) return { color: 'text-yellow-600', label: 'Soon', priority: 'low' };
    return { color: 'text-green-600', label: 'OK', priority: 'none' };
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev =>
      prev.includes(alertId)
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Expiration Tracking</h1>
          <p className="text-gray-600">Monitor expiring inventory and reduce waste through proactive alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedAlerts.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={selectedAlerts.length === 0}
          >
            <Settings className="h-4 w-4 mr-2" />
            Bulk Actions ({selectedAlerts.length})
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </button>
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
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalActiveAlerts}</p>
                <p className="text-xs text-gray-500">Need attention</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</p>
                <p className="text-xs text-gray-500">Immediate action</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waste Value</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.estimatedWasteValue)}</p>
                <p className="text-xs text-gray-500">At risk</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiring This Week</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.itemsExpiringThisWeek}</p>
                <p className="text-xs text-gray-500">Within 7 days</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedAlerts.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-purple-900 font-medium">
                {selectedAlerts.length} alert{selectedAlerts.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('acknowledge')}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Acknowledge All
                </button>
                <button
                  onClick={() => handleBulkAction('resolve')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Resolve All
                </button>
                <button
                  onClick={() => handleBulkAction('dismiss')}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Dismiss All
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedAlerts([]);
                setShowBulkActions(false);
              }}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
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
              value={alertTypeFilter}
              onChange={(e) => setAlertTypeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {alertTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              {timeFilters.map(filter => (
                <option key={filter} value={filter}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Expiration Alerts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.map((alert) => {
                const AlertIcon = getAlertTypeIcon(alert.alert_type);
                const urgency = getExpirationUrgency(alert.days_until_expiry);
                const isSelected = selectedAlerts.includes(alert.id);

                return (
                  <div
                    key={alert.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAlertSelection(alert.id)}
                        className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${getAlertTypeColor(alert.alert_type)}`}>
                              <AlertIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{alert.item_name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">{alert.item_category}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">Batch: {alert.batch_number}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className={`text-xs font-medium ${urgency.color}`}>
                                  {urgency.label}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${urgency.color}`}>
                                {alert.days_until_expiry < 0 ? 'Expired' :
                                 alert.days_until_expiry === 0 ? 'Today' :
                                 alert.days_until_expiry === 1 ? 'Tomorrow' :
                                 `${alert.days_until_expiry} days`}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAlert(alert);
                                }}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.expiration_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {alert.quantity_affected} {alert.unit}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {formatCurrency(alert.estimated_waste_value)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              alert.status === 'active' ? 'bg-red-100 text-red-800' :
                              alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                              alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {alert.status}
                            </span>
                            {alert.notification_sent && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs">Notified</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-3 flex items-center space-x-2">
                          {alert.status === 'active' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledgeAlert(alert.id);
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Acknowledge
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveAlert(alert.id, 'Resolved via quick action');
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          {alert.status === 'acknowledged' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveAlert(alert.id, 'Resolved after acknowledgment');
                              }}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Complete Resolution
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissAlert(alert.id);
                            }}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alert Details */}
        <div className="lg:col-span-1">
          {selectedAlert ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alert Details</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Item Information</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <p className="font-medium text-gray-900">{selectedAlert.item_name}</p>
                    <p className="text-sm text-gray-600">{selectedAlert.item_category}</p>
                    <p className="text-xs text-gray-500 mt-1">Batch: {selectedAlert.batch_number}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Expiration Details</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Expiration Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedAlert.expiration_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Days Until</span>
                      <span className={`font-medium ${getExpirationUrgency(selectedAlert.days_until_expiry).color}`}>
                        {selectedAlert.days_until_expiry < 0 ? 'Expired' :
                         selectedAlert.days_until_expiry === 0 ? 'Today' :
                         selectedAlert.days_until_expiry === 1 ? 'Tomorrow' :
                         `${selectedAlert.days_until_expiry} days`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Impact Assessment</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantity Affected</span>
                      <span className="font-medium text-gray-900">
                        {selectedAlert.quantity_affected} {selectedAlert.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">Waste Value</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(selectedAlert.estimated_waste_value)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Alert Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                      selectedAlert.status === 'active' ? 'bg-red-100 text-red-800' :
                      selectedAlert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                      selectedAlert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAlert.status}
                    </span>
                  </div>
                </div>

                {selectedAlert.notification_sent && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Notification</label>
                    <div className="mt-1 p-3 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Notification sent</span>
                      </div>
                      {selectedAlert.notification_date && (
                        <p className="text-xs text-green-600 mt-1">
                          {new Date(selectedAlert.notification_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedAlert.acknowledged_by && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Acknowledgment</label>
                    <div className="mt-1 p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-yellow-800">
                        Acknowledged by {selectedAlert.acknowledged_by}
                      </p>
                      {selectedAlert.acknowledged_at && (
                        <p className="text-xs text-yellow-600 mt-1">
                          {new Date(selectedAlert.acknowledged_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedAlert.resolution_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
                    <div className="mt-1 p-3 bg-green-50 rounded">
                      <p className="text-sm text-green-800">{selectedAlert.resolution_notes}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  {selectedAlert.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Acknowledge Alert
                      </button>
                      <button
                        onClick={() => handleResolveAlert(selectedAlert.id, 'Resolved from detail view')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Resolved
                      </button>
                    </>
                  )}
                  {selectedAlert.status === 'acknowledged' && (
                    <button
                      onClick={() => handleResolveAlert(selectedAlert.id, 'Completed resolution')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete Resolution
                    </button>
                  )}
                  <button
                    onClick={() => handleDismissAlert(selectedAlert.id)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select an alert to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {notificationSettings.map((setting) => (
                <div key={setting.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {setting.alert_type} Alerts
                      </h4>
                      <p className="text-sm text-gray-600">
                        {setting.days_before} days before expiration
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      setting.alert_type === 'critical' ? 'bg-red-100 text-red-800' :
                      setting.alert_type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {setting.alert_type.toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Email Notifications</span>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.email_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.email_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">SMS Notifications</span>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.sms_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.sms_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">In-App Notifications</span>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          setting.in_app_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.in_app_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {(setting.email_enabled || setting.sms_enabled) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recipients</p>
                      {setting.email_enabled && setting.recipient_emails.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <strong>Email:</strong> {setting.recipient_emails.join(', ')}
                        </div>
                      )}
                      {setting.sms_enabled && setting.recipient_phones.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          <strong>SMS:</strong> {setting.recipient_phones.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};