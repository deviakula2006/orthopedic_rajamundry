import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';

const OrderInvestigationModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { investigations, orderInvestigation } = useHospital();
  const [selectedTestId, setSelectedTestId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTestId) return;

    const test = investigations.find((i) => i.id === selectedTestId);
    if (test) {
      await orderInvestigation(patientId, test);
      if (onSuccess) onSuccess();
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Diagnostics Investigation" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Investigation Test
          </label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            required
          >
            <option value="">-- Choose Test --</option>
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.testName} (₹{inv.price})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
            disabled={!selectedTestId}
          >
            Place Order
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderInvestigationModal;
