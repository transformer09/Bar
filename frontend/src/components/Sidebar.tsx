import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/owner/dashboard', label: '👑 Owner Dashboard', roles: ['owner', 'manager'] },
    { path: '/dashboard', label: '📊 Dashboard', roles: ['manager', 'bartender', 'chef', 'waiter', 'support', 'cashier'] },
    {
      path: '/pos',
      label: '💳 Point of Sale',
      roles: ['manager', 'bartender', 'waiter'],
      subItems: [
        { path: '/pos', label: '💳 Classic POS' },
        { path: '/pos/modern', label: '🎨 Modern POS' },
      ]
    },
    {
      path: '/cashier',
      label: '💰 Cashier',
      roles: ['manager', 'cashier'],
      subItems: [
        { path: '/cashier', label: '💰 Classic Cashier' },
        { path: '/cashier/dashboard', label: '📊 Cashier Dashboard' },
      ]
    },
    {
      path: '/inventory',
      label: '📦 Inventory Management',
      roles: ['manager'],
      subItems: [
        { path: '/inventory/dashboard', label: '📊 Inventory Dashboard' },
        { path: '/inventory/stock-management', label: '📦 Stock Management' },
        { path: '/inventory/batch-management', label: '📋 Batch Management' },
        { path: '/inventory/expiration-tracking', label: '⏰ Expiration Tracking' },
        { path: '/inventory/price-management', label: '💰 Price Management' },
      ]
    },
    { path: '/lodge', label: '🏨 Lodge Management', roles: ['manager', 'lodge-manager', 'reception'] },
    { path: '/credit', label: '💳 Credit Management', roles: ['manager', 'credit-manager'] },
    { path: '/purchase-orders', label: '🛒 Purchase Orders', roles: ['manager'] },
    { path: '/bar', label: '🍹 Bar Management', roles: ['manager', 'bartender'] },
    { path: '/kitchen', label: '👨‍🍳 Kitchen Orders', roles: ['manager', 'chef', 'waiter', 'bartender'] },
    { path: '/staff', label: '👥 Staff', roles: ['manager'] },
    { path: '/reports', label: '📈 Reports', roles: ['manager'] },
    { path: '/system/settings', label: '⚙️ System Settings', roles: ['owner', 'admin'] },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <aside className="w-64 bg-white shadow-md border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => (
          <div key={item.path}>
            <Link
              to={item.path}
              className={`block px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path || (item.subItems && location.pathname.startsWith(item.path))
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
            {item.subItems && (location.pathname.startsWith(item.path)) && (
              <div className="ml-4 mt-2 space-y-1">
                {item.subItems.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`block px-4 py-2 rounded-lg transition-colors text-sm ${
                      location.pathname === subItem.path
                        ? 'bg-primary-100 text-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
