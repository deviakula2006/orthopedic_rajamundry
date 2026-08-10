import { Modal } from '../ui/Modal';
import { AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const TYPE_META = {
  danger:  { icon: AlertOctagon,  iconBg: '#fff1f2', iconColor: '#ef4444', btnBg: '#dc2626', btnHover: '#b91c1c' },
  warning: { icon: AlertTriangle, iconBg: '#fffbeb', iconColor: '#d97706', btnBg: '#f59e0b', btnHover: '#d97706' },
  info:    { icon: Info,          iconBg: '#eff6ff', iconColor: '#3b82f6', btnBg: '#2278e8', btnHover: '#1c6dd9' },
};

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  type        = 'danger',
}) => {
  const meta = TYPE_META[type] ?? TYPE_META.danger;
  const Icon = meta.icon;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xs">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', paddingBottom: '0.25rem' }}>
        {/* Icon */}
        <div
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: meta.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: 22, height: 22, color: meta.iconColor }} />
        </div>

        {/* Message */}
        <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.6, fontWeight: 500 }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, height: 36, borderRadius: 8,
              border: '1px solid #d1d5db', background: '#ffffff',
              fontSize: '0.8125rem', fontWeight: 600, color: '#374151',
              cursor: 'pointer', transition: 'all 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              flex: 1, height: 36, borderRadius: 8,
              border: 'none', background: meta.btnBg,
              fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff',
              cursor: 'pointer', transition: 'all 120ms',
              boxShadow: `0 1px 2px rgba(0,0,0,0.2)`,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = meta.btnHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = meta.btnBg; }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
