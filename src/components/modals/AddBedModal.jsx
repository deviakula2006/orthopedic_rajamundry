import { useState } from 'react';
import { Modal } from '../ui/Modal';
import apiClient from '../../services/api';

/**
 * AddBedModal
 *
 * Standalone — does NOT depend on HospitalContext.
 * Calls POST /api/bed-management/wards/:wardId/beds directly.
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   wardId   {string}   — UUID of the target ward
 *   wardName {string}   — display name of the ward (for the title)
 *   onSaved  {(bed) => void}  — called with the new bed on success
 */
const AddBedModal = ({ isOpen, onClose, wardId, wardName, onSaved }) => {
  const [bedNumber, setBedNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setBedNumber('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bedNumber.trim() || !wardId) return;
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post(`/bed-management/wards/${wardId}/beds`, {
        bedNumber: bedNumber.trim()
      });
      onSaved?.(res.data.data);
      handleClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to add bed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Bed to ${wardName || 'Ward'}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Bed Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
            placeholder="e.g. G1, G2, ICU-01"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            Must be unique within this ward.
          </p>
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
            disabled={loading || !bedNumber.trim()}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Bed'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddBedModal;
