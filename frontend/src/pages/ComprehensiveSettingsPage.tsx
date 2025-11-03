import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ComprehensiveSettingsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { theme: currentTheme, fonts: currentFonts, refreshTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'themes' | 'fonts' | 'modules' | 'users' | 'roles' | 'auth' | 'config'>('users');
  const [loading, setLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    phone: '',
    role: 'waiter',
    auth_methods: ['password'],
  });
  const [showUserForm, setShowUserForm] = useState(false);

  // Roles state
  const [roles, setRoles] = useState<any[]>([]);
  const [newRoleForm, setNewRoleForm] = useState({
    role_name: '',
    description: '',
    icon: '👤',
    color: '#000000',
  });
  const [showRoleForm, setShowRoleForm] = useState(false);

  // Auth methods state
  const [authMethods, setAuthMethods] = useState<any[]>([]);

  // Config state
  const [config, setConfig] = useState<any[]>([]);

  const [themes, setThemes] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      loadAllSettings();
    }
  }, [token, activeTab]);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'users') {
        const usersRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, { headers });
        if (usersRes.ok) setUsers(await usersRes.json());
      } else if (activeTab === 'roles') {
        const rolesRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/roles`, { headers });
        if (rolesRes.ok) setRoles(await rolesRes.json());
      } else if (activeTab === 'auth') {
        const authRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/auth-methods`, { headers });
        if (authRes.ok) setAuthMethods(await authRes.json());
      } else if (activeTab === 'config') {
        const configRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/config`, { headers });
        if (configRes.ok) setConfig(await configRes.json());
      } else if (activeTab === 'themes') {
        const themesRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/themes`, { headers });
        if (themesRes.ok) setThemes(await themesRes.json());
      } else if (activeTab === 'fonts') {
        const fontsRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/fonts`, { headers });
        if (fontsRes.ok) setFonts(await fontsRes.json());
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      if (!newUserForm.email || !newUserForm.password || !newUserForm.first_name || !newUserForm.last_name) {
        alert('Please fill all required fields');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserForm),
      });

      if (response.ok) {
        alert('User created successfully!');
        setNewUserForm({
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          phone: '',
          role: 'waiter',
          auth_methods: ['password'],
        });
        setShowUserForm(false);
        loadAllSettings();
      } else {
        alert('Error creating user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Create new role
  const handleCreateRole = async () => {
    try {
      if (!newRoleForm.role_name) {
        alert('Please enter role name');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/roles`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoleForm),
      });

      if (response.ok) {
        alert('Role created successfully!');
        setNewRoleForm({ role_name: '', description: '', icon: '👤', color: '#000000' });
        setShowRoleForm(false);
        loadAllSettings();
      } else {
        alert('Error creating role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  // Toggle auth method
  const handleToggleAuthMethod = async (method: string, enabled: boolean) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/auth-methods/${method}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        loadAllSettings();
      }
    } catch (error) {
      console.error('Error toggling auth method:', error);
    }
  };

  // Update config value
  const handleUpdateConfig = async (key: string, value: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/config/${key}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config_value: value }),
      });

      if (response.ok) {
        alert('Configuration updated!');
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  if (loading && users.length === 0 && roles.length === 0 && authMethods.length === 0 && config.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure themes, users, roles, authentication, and system-wide settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b overflow-x-auto">
        {(['users', 'roles', 'auth', 'config', 'themes', 'fonts', 'modules'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors capitalize whitespace-nowrap ${
              activeTab === tab ? 'text-primary border-primary' : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            {tab === 'users' && '👥 Users'}
            {tab === 'roles' && '👔 Roles'}
            {tab === 'auth' && '🔐 Auth Methods'}
            {tab === 'config' && '⚙️ Configuration'}
            {tab === 'themes' && '🎨 Themes'}
            {tab === 'fonts' && '📝 Fonts'}
            {tab === 'modules' && '📦 Modules'}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
            <button
              onClick={() => setShowUserForm(!showUserForm)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
            >
              {showUserForm ? 'Cancel' : '+ Create New User'}
            </button>
          </div>

          {/* Create User Form */}
          {showUserForm && (
            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={newUserForm.first_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={newUserForm.last_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="manager">Manager</option>
                  <option value="waiter">Waiter</option>
                  <option value="bartender">Bartender</option>
                  <option value="chef">Chef</option>
                  <option value="cashier">Cashier</option>
                  <option value="support">Support</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Authentication Methods</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUserForm.auth_methods.includes('password')}
                      onChange={(e) => {
                        const methods = newUserForm.auth_methods;
                        if (e.target.checked) {
                          methods.push('password');
                        } else {
                          methods.splice(methods.indexOf('password'), 1);
                        }
                        setNewUserForm({ ...newUserForm, auth_methods: methods });
                      }}
                      className="w-4 h-4 mr-2"
                    />
                    <span>Password</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUserForm.auth_methods.includes('fingerprint')}
                      onChange={(e) => {
                        const methods = newUserForm.auth_methods;
                        if (e.target.checked) {
                          methods.push('fingerprint');
                        } else {
                          methods.splice(methods.indexOf('fingerprint'), 1);
                        }
                        setNewUserForm({ ...newUserForm, auth_methods: methods });
                      }}
                      className="w-4 h-4 mr-2"
                    />
                    <span>Fingerprint</span>
                  </label>
                </div>
              </div>
              <div className="col-span-2">
                <button
                  onClick={handleCreateUser}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create User
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Login</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {usr.first_name} {usr.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{usr.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {usr.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          usr.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {usr.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {usr.last_login ? new Date(usr.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button className="text-primary hover:underline">Edit</button>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
            <button
              onClick={() => setShowRoleForm(!showRoleForm)}
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
            >
              {showRoleForm ? 'Cancel' : '+ Create Custom Role'}
            </button>
          </div>

          {/* Create Role Form */}
          {showRoleForm && (
            <div className="bg-white rounded-lg shadow p-6 grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={newRoleForm.role_name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, role_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={newRoleForm.icon}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-center text-2xl"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newRoleForm.color}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, color: e.target.value })}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newRoleForm.color}
                    onChange={(e) => setNewRoleForm({ ...newRoleForm, color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <button
                  onClick={handleCreateRole}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create Role
                </button>
              </div>
            </div>
          )}

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{role.icon}</div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      role.is_system_role ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {role.is_system_role ? 'System' : 'Custom'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{role.role_name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90">
                    Permissions
                  </button>
                  {!role.is_system_role && (
                    <button className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTH METHODS TAB */}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {authMethods.map((method) => (
              <div key={method.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 capitalize">{method.method_name}</h3>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={() => handleToggleAuthMethod(method.method_name, method.enabled)}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">{method.description}</p>
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Status: <span className={method.enabled ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {method.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {config.map((cfg) => (
              <div key={cfg.id} className="pb-6 border-b last:border-b-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                  {cfg.config_key.replace(/_/g, ' ')}
                </label>
                <p className="text-xs text-gray-500 mb-2">{cfg.description}</p>
                {typeof cfg.config_value === 'boolean' ? (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.config_value}
                      onChange={(e) => handleUpdateConfig(cfg.config_key, e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="ml-2 text-gray-700">{cfg.config_value ? 'Enabled' : 'Disabled'}</span>
                  </label>
                ) : typeof cfg.config_value === 'number' ? (
                  <input
                    type="number"
                    defaultValue={cfg.config_value}
                    onBlur={(e) => handleUpdateConfig(cfg.config_key, parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ) : (
                  <input
                    type="text"
                    defaultValue={typeof cfg.config_value === 'string' ? cfg.config_value : JSON.stringify(cfg.config_value)}
                    onBlur={(e) => handleUpdateConfig(cfg.config_key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Themes and Fonts tabs can be integrated similarly */}
    </div>
  );
};

export default ComprehensiveSettingsPage;
