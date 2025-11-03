import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch overview');

        const data = await response.json();
        setOverview(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOverview();
    }
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Today Sales</h3>
          <p className="text-3xl font-bold text-primary">
            ${overview?.total_sales_today?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {overview?.sales_change_percentage > 0 ? '↑' : '↓'} {Math.abs(overview?.sales_change_percentage).toFixed(1)}% vs yesterday
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Staff</h3>
          <p className="text-3xl font-bold text-secondary">{overview?.active_staff_count || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-accent">{overview?.low_stock_items_count || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
          <p className="text-xl font-semibold text-gray-900 capitalize">{user?.role}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {user?.role === 'bartender' && (
            <>
              <button className="p-4 bg-primary text-white rounded-lg hover:opacity-90">Add Sale</button>
              <button className="p-4 bg-secondary text-white rounded-lg hover:opacity-90">View Recipes</button>
            </>
          )}
          {user?.role === 'chef' && (
            <button className="p-4 bg-accent text-white rounded-lg hover:opacity-90">View Orders</button>
          )}
          {user?.role === 'manager' && (
            <>
              <button className="p-4 bg-primary text-white rounded-lg hover:opacity-90">New Item</button>
              <button className="p-4 bg-secondary text-white rounded-lg hover:opacity-90">PO</button>
              <button className="p-4 bg-accent text-white rounded-lg hover:opacity-90">Staff</button>
              <button className="p-4 bg-blue-600 text-white rounded-lg hover:opacity-90">Reports</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
