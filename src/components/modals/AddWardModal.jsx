import { useState } from 'react';
import { Modal } from '../ui/Modal';
import apiClient from '../../services/api';

/**
 * AddWardModal
 *
 * Standalone — does NOT depend on HospitalContext.
 * Calls POST /api/bed-management/wards directly.
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   onSaved  {(ward) => void}  — called with the new ward object on success
 */
const AddWardModal = ({ isOpen, onClose, onSaved }) => {
  const [name, setName] = useState('');
  const [dailyCharge, setDailyCharge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setDailyCharge('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/bed-management/wards', {
        name: name.trim(),
        dailyCharge: parseFloat(dailyCharge) || 0
      });
      onSaved?.(res.data.data);
      handleClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to create ward'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Ward" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Ward Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General Ward, ICU, Post-Op"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Daily Charge (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={dailyCharge}
            onChange={(e) => setDailyCharge(e.target.value)}
            placeholder="e.g. 800"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Ward'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddWardModal;
