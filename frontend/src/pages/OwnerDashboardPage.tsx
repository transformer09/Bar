import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TableOccupancyHeatmap from '../components/TableOccupancyHeatmap';
import StaffMovementTimeline from '../components/StaffMovementTimeline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardMetrics {
  financial: { totalRevenue: number; totalTransactions: number; avgTransactionValue: number; paymentsPending: number };
  operations: { occupiedTablesCount: number; totalTables: number; activeStaffCount: number; pendingOrdersCount: number };
  staff: any[];
  recentActivities: any[];
  notifications: any[];
  alerts: any[];
}

interface ProfitLossData {
  total_sales: number;
  inventory_cost: number;
  labor_cost: number;
  operational_cost: number;
  gross_profit: number;
  profit_margin_percent: number;
}

const OwnerDashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [pnl, setPnL] = useState<ProfitLossData | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [unusualActivities, setUnusualActivities] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'operations' | 'alerts'>('overview');
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (token) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, pnlRes, staffRes, unusualRes, notifCountRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/owner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/owner/analytics/profit-loss`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/owner/analytics/staff-performance?start_date=${new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/owner/analytics/unusual-activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/owner/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const dashboardData = await dashboardRes.json();
      setDashboard(dashboardData);

      const pnlData = await pnlRes.json();
      setPnL(pnlData);

      const staffData = await staffRes.json();
      setStaffPerformance(staffData);

      const unusualData = await unusualRes.json();
      setUnusualActivities(unusualData.flags || []);

      const notifCount = await notifCountRes.json();
      setUnreadNotifications(notifCount.unread_count);

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const chartData = [
    { name: 'Revenue', value: pnl?.total_sales || 0 },
    { name: 'Costs', value: pnl?.inventory_cost || 0 },
    { name: 'Profit', value: pnl?.gross_profit || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Owner Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time bar performance analytics and operations tracking</p>
          </div>
          <div className="text-right">
            {unreadNotifications > 0 && (
              <div className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
                🔔 {unreadNotifications} Unread Alerts
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          {(['overview', 'analytics', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Today's Revenue</h3>
                <p className="text-4xl font-bold text-primary">${dashboard.financial.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">{dashboard.financial.totalTransactions} transactions</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Gross Profit</h3>
                <p className="text-4xl font-bold text-green-600">${(pnl?.gross_profit || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">{pnl?.profit_margin_percent.toFixed(1)}% margin</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Active Staff</h3>
                <p className="text-4xl font-bold text-accent">{dashboard.operations.activeStaffCount}</p>
                <p className="text-xs text-gray-500 mt-2">Currently working</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-semibold mb-2">Occupied Tables</h3>
                <p className="text-4xl font-bold text-secondary">{dashboard.operations.occupiedTablesCount}</p>
                <p className="text-xs text-gray-500 mt-2">Active guests</p>
              </div>
            </div>

            {/* Financials Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Financials</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B4513" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Real-Time Activity Feed */}
            <div className="grid grid-cols-2 gap-6">
              {/* Recent Activities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {dashboard.recentActivities.slice(0, 10).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <span className="text-xl">📍</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activity.activity_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Staff */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Active Staff</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {dashboard.staff.map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {staff.users?.first_name} {staff.users?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{staff.users?.role}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Profit & Loss Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profit & Loss Statement</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="border-l-4 border-primary pl-4 py-3">
                  <p className="text-gray-600 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">${(pnl?.total_sales || 0).toFixed(2)}</p>
                </div>
                <div className="border-l-4 border-red-500 pl-4 py-3">
                  <p className="text-gray-600 text-sm">Total Costs</p>
                  <p className="text-2xl font-bold text-gray-900">${(pnl?.inventory_cost || 0).toFixed(2)}</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4 py-3">
                  <p className="text-gray-600 text-sm">Gross Profit</p>
                  <p className="text-2xl font-bold text-green-600">${(pnl?.gross_profit || 0).toFixed(2)}</p>
                </div>
                <div className="border-l-4 border-accent pl-4 py-3">
                  <p className="text-gray-600 text-sm">Profit Margin</p>
                  <p className="text-2xl font-bold text-accent">{(pnl?.profit_margin_percent || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Staff Performance Comparison */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Staff Performance (Last 7 Days)</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Staff Member</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Orders</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Revenue</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Avg Order</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerformance.slice(0, 10).map((staff, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{staff.ordersCount}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">${staff.revenueGenerated.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">${staff.avgOrderValue.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{staff.hoursWorked.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Operations Tab */}
        {activeTab === 'operations' && (
          <div className="space-y-8">
            {/* Table Occupancy Heatmap */}
            <TableOccupancyHeatmap />

            {/* Staff Movement Timeline */}
            <StaffMovementTimeline />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-8">
            {/* Unusual Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Unusual Activity Alerts</h2>
              {unusualActivities.length > 0 ? (
                <div className="space-y-4">
                  {unusualActivities.slice(0, 10).map((activity, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        activity.risk_level === 'critical'
                          ? 'bg-red-50 border-red-500'
                          : activity.risk_level === 'high'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{activity.flag_reason}</p>
                          <p className={`text-sm font-semibold mt-1 ${
                            activity.risk_level === 'critical'
                              ? 'text-red-700'
                              : activity.risk_level === 'high'
                              ? 'text-orange-700'
                              : 'text-yellow-700'
                          }`}>
                            Risk Level: {activity.risk_level.toUpperCase()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            activity.resolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {activity.resolved ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg font-semibold">No unusual activities detected</p>
                  <p className="text-sm">Everything is operating normally</p>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Notifications</h2>
              {dashboard?.notifications && dashboard.notifications.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.notifications.slice(0, 10).map((notif, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent notifications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
