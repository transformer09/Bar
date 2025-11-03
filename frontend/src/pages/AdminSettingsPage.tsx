import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const { theme: currentTheme, fonts: currentFonts, refreshTheme } = useTheme();
  const [themes, setThemes] = useState<any[]>([]);
  const [fonts, setFonts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'themes' | 'fonts' | 'modules'>('themes');
  const [loading, setLoading] = useState(true);
  const [newThemeForm, setNewThemeForm] = useState({
    name: '',
    primary_color: '#8B4513',
    secondary_color: '#D2691E',
    accent_color: '#FF8C00',
  });

  useEffect(() => {
    loadSettings();
  }, [token]);

  const loadSettings = async () => {
    try {
      const [themesRes, fontsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/themes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/fonts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (themesRes.ok) {
        const themesData = await themesRes.json();
        setThemes(themesData);
      }

      if (fontsRes.ok) {
        const fontsData = await fontsRes.json();
        setFonts(fontsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/themes/${themeId}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        loadSettings();
        await refreshTheme();
        alert('Theme activated successfully!');
      }
    } catch (error) {
      console.error('Error activating theme:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure themes, fonts, modules, and system-wide settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b">
        <button
          onClick={() => setActiveTab('themes')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'themes'
              ? 'text-primary border-primary'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Themes
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'fonts'
              ? 'text-primary border-primary'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Fonts
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'modules'
              ? 'text-primary border-primary'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Modules & Roles
        </button>
      </div>

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div className="grid grid-cols-2 gap-8">
          {/* Theme List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Themes</h2>
            <div className="space-y-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
                    currentTheme?.id === theme.id
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                    {currentTheme?.id === theme.id && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Color Preview */}
                  <div className="flex gap-2 mb-4">
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: theme.primary_color }}
                      title="Primary"
                    />
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: theme.secondary_color }}
                      title="Secondary"
                    />
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: theme.accent_color }}
                      title="Accent"
                    />
                    <div
                      className="w-12 h-12 rounded"
                      style={{ backgroundColor: theme.success_color }}
                      title="Success"
                    />
                  </div>

                  {currentTheme?.id !== theme.id && (
                    <button
                      onClick={() => handleActivateTheme(theme.id)}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
                    >
                      Activate Theme
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create New Theme */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Theme</h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Theme Name</label>
                <input
                  type="text"
                  value={newThemeForm.name}
                  onChange={(e) =>
                    setNewThemeForm({ ...newThemeForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newThemeForm.primary_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, primary_color: e.target.value })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newThemeForm.primary_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, primary_color: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newThemeForm.secondary_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, secondary_color: e.target.value })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newThemeForm.secondary_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, secondary_color: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newThemeForm.accent_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, accent_color: e.target.value })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newThemeForm.accent_color}
                    onChange={(e) =>
                      setNewThemeForm({ ...newThemeForm, accent_color: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
                Create Theme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fonts Tab */}
      {activeTab === 'fonts' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Font Settings</h2>
          <div className="grid grid-cols-2 gap-6">
            {fonts.map((font) => (
              <div key={font.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{font.name}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Body Font:</strong> {font.primary_font}
                  </p>
                  <p>
                    <strong>Heading Font:</strong> {font.heading_font}
                  </p>
                  <p>
                    <strong>Base Size:</strong> {font.base_font_size}px
                  </p>
                  <p>
                    <strong>Heading Size:</strong> {font.heading_font_size}px
                  </p>
                </div>
                {currentFonts?.id === font.id ? (
                  <button className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
                    ✓ Active
                  </button>
                ) : (
                  <button className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90">
                    Activate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Modules & Role Permissions</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-4">
              Configure which modules are visible to which roles and manage permissions
            </p>
            <button className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90">
              Manage Module Permissions
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
