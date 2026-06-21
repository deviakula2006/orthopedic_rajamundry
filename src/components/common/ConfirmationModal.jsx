import React from 'react';
import { Modal } from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  type = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center gap-4 text-center py-2">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            type === 'warning'
              ? 'bg-amber-50 text-amber-600'
              : type === 'info'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{message}</p>
        </div>
        <div className="flex items-center gap-3 w-full mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition-colors cursor-pointer ${
              type === 'warning'
                ? 'bg-amber-500 hover:bg-amber-600'
                : type === 'info'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
