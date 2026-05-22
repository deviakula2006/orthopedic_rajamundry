import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/auth/Login';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Patients from '../pages/admin/Patients';
import Doctors from '../pages/admin/Doctors';
import Receptionists from '../pages/admin/Receptionists';
import Appointments from '../pages/admin/Appointments';
import Investigations from '../pages/admin/Investigations';
import Billing from '../pages/admin/Billing';
import BedManagement from '../pages/admin/BedManagement';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-hospital-500 border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-500">Securing environment...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="receptionists" element={<Receptionists />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="investigations" element={<Investigations />} />
        <Route path="billing" element={<Billing />} />
        <Route path="beds" element={<BedManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
