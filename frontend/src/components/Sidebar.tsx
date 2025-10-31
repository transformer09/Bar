import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/owner', label: '👑 Owner Dashboard', roles: ['owner', 'manager'] },
    { path: '/dashboard', label: '📊 Dashboard', roles: ['manager', 'bartender', 'chef', 'waiter', 'support', 'cashier'] },
    { path: '/pos', label: '💳 Point of Sale', roles: ['manager', 'bartender', 'waiter'] },
    { path: '/cashier', label: '💰 Cashier', roles: ['manager', 'cashier'] },
    { path: '/inventory', label: '📦 Inventory', roles: ['manager'] },
    { path: '/purchase-orders', label: '🛒 Purchase Orders', roles: ['manager'] },
    { path: '/bar', label: '🍹 Bar Management', roles: ['manager', 'bartender'] },
    { path: '/kitchen', label: '👨‍🍳 Kitchen Orders', roles: ['manager', 'chef', 'waiter', 'bartender'] },
    { path: '/staff', label: '👥 Staff', roles: ['manager'] },
    { path: '/reports', label: '📈 Reports', roles: ['manager'] },
    { path: '/admin/settings', label: '⚙️ Admin Settings', roles: ['manager'] },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(user?.role || ''));

  return (
    <aside className="w-64 bg-white shadow-md border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-primary text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
