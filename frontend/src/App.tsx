import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import BarPage from './pages/BarPage';
import KitchenPage from './pages/KitchenPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import POSPage from './pages/POSPage';
import CashierPage from './pages/CashierPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {isLoggedIn && <Header />}
      <div className="flex flex-1 overflow-hidden">
        {isLoggedIn && <Sidebar />}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute>
                  <PurchaseOrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bar"
              element={
                <ProtectedRoute>
                  <BarPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <KitchenPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POSPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cashier"
              element={
                <ProtectedRoute>
                  <CashierPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner"
              element={
                <ProtectedRoute>
                  <OwnerDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
