import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import { User, Calendar, Activity } from 'lucide-react';

const OrderInvestigationModal = ({ isOpen, onClose, patientId, appointment = null, onSuccess }) => {
  const { patients, investigations, orderInvestigation } = useHospital();
  const [selectedTestId, setSelectedTestId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTestId('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const targetPatient = useMemo(() => {
    if (!patientId && !appointment) return null;
    const pid = patientId || appointment?.patientId;
    return patients.find(p => p.id === pid || p.dbId === pid || p.code === pid) || null;
  }, [patients, patientId, appointment]);

  const selectedTest = useMemo(() => {
    return investigations.find(i => i.id === selectedTestId || i.dbId === selectedTestId);
  }, [investigations, selectedTestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTestId || isSubmitting) return;

    const pid = patientId || targetPatient?.id || appointment?.patientId;
    if (!pid || !selectedTest) return;

    setIsSubmitting(true);
    try {
      const ok = await orderInvestigation(pid, selectedTest, appointment);
      if (ok) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientName = targetPatient?.name || appointment?.patientName || 'Patient';
  const patientCode = targetPatient?.id || appointment?.patientId || '';
  const appointmentCode = appointment?.id || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Diagnostics Investigation" size="md">
      {/* Patient & Appointment Context Header */}
      {(targetPatient || appointment) && (
        <div className="mb-4 p-3 bg-hospital-50 border border-hospital-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-hospital-100 flex items-center justify-center text-hospital-700 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800">{patientName}</div>
              <div className="text-slate-500 font-mono text-[11px]">{patientCode}</div>
            </div>
          </div>
          {appointmentCode && (
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-hospital-200 text-hospital-700 font-mono font-bold text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{appointmentCode}</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Select Investigation Test
          </label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            required
          >
            <option value="">-- Choose Test from Directory --</option>
            {investigations.map((inv) => (
              <option key={inv.id || inv.dbId} value={inv.id || inv.dbId}>
                {inv.testName} {inv.category ? `(${inv.category})` : ''} — ₹{inv.price}
              </option>
            ))}
          </select>
        </div>

        {selectedTest && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-hospital-600" />
              <span className="font-semibold text-slate-700">{selectedTest.testName}</span>
            </div>
            <span className="font-bold text-hospital-700">₹{selectedTest.price}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
            disabled={!selectedTestId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ordering...</span>
              </>
            ) : (
              <span>Place Order</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderInvestigationModal;
