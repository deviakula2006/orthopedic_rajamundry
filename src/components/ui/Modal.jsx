import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SIZE_MAP = {
  xs: '22rem',
  sm: '28rem',
  md: '42rem',
  lg: '56rem',
  xl: '72rem',
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
}) => {
  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ overflowY: 'auto' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.42)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96, y: 12  }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: SIZE_MAP[size] ?? SIZE_MAP.md,
              maxHeight: '90vh',
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e6ea',
              boxShadow: '0 20px 40px -8px rgba(0,0,0,0.18), 0 8px 16px -8px rgba(0,0,0,0.10)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #f1f3f4', flexShrink: 0 }}
            >
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
                  {title}
                </h3>
                {subtitle && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2, fontWeight: 400 }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 28, width: 28, borderRadius: 6, flexShrink: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', transition: 'all 120ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Optional footer slot */}
            {footer && (
              <div
                className="px-6 py-4"
                style={{ borderTop: '1px solid #f1f3f4', flexShrink: 0 }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
