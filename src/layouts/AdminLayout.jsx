import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import { useHospital } from '../context/HospitalContext';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts } = useHospital();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertOctagon className="h-5 w-5 text-rose-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-100 bg-emerald-50 text-emerald-800';
      case 'warning':
        return 'border-amber-100 bg-amber-50 text-amber-800';
      case 'error':
        return 'border-rose-100 bg-rose-50 text-rose-800';
      default:
        return 'border-blue-100 bg-blue-50 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <div className="flex flex-col lg:pl-72 min-h-screen">
        <Topbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md ${getToastColor(
                toast.type
              )}`}
            >
              <div className="mt-0.5">{getToastIcon(toast.type)}</div>
              <div className="flex-1 text-sm font-semibold leading-relaxed">
                {toast.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminLayout;
