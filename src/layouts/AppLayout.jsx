import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import { useHospital } from '../context/HospitalContext';
import { CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts } = useHospital();
  const location = useLocation();

  const hideSidebar = location.pathname.startsWith('/doctor');
  const toggleSidebar = () => setSidebarOpen(v => !v);

  const toastMeta = {
    success: { icon: CheckCircle,  cls: 'text-emerald-600', bar: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#065f46' },
    warning: { icon: AlertTriangle, cls: 'text-amber-600',  bar: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#78350f' },
    error:   { icon: AlertOctagon, cls: 'text-rose-600',    bar: '#ef4444', bg: '#fff1f2', border: '#fecdd3', text: '#881337' },
    info:    { icon: Info,          cls: 'text-blue-600',   bar: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* Sidebar */}
      {!hideSidebar && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      {/* Main column */}
      <div className={`flex min-h-screen flex-col${hideSidebar ? '' : ' lg:pl-[17rem]'}`}>
        <Topbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-5 md:p-6 lg:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-[22rem]">
        <AnimatePresence>
          {toasts.map((toast) => {
            const meta = toastMeta[toast.type] ?? toastMeta.info;
            const Icon = meta.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
                style={{
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  borderRadius: 10,
                  boxShadow: '0 8px 16px -4px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Left accent bar */}
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: meta.bar, borderRadius: '10px 0 0 10px',
                  }}
                />
                <div className="flex items-start gap-3 px-4 py-3 pl-5">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${meta.cls}`} />
                  <p className="text-[13px] font-semibold flex-1" style={{ color: meta.text }}>
                    {toast.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppLayout;
