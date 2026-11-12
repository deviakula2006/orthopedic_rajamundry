import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import { User, Calendar, Search, X, CheckCircle2 } from 'lucide-react';

const OrderInvestigationModal = ({ isOpen, onClose, patientId, appointment = null, onSuccess }) => {
  const { patients, investigations, orderInvestigationsBatch } = useHospital();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      setSearchTerm('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const targetPatient = useMemo(() => {
    if (!patientId && !appointment) return null;
    const pid = patientId || appointment?.patientId;
    return patients.find(p => p.id === pid || p.dbId === pid || p.code === pid) || null;
  }, [patients, patientId, appointment]);

  // Filter investigations by search term
  const filteredInvestigations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return investigations;
    return investigations.filter(
      inv =>
        (inv.testName || '').toLowerCase().includes(term) ||
        (inv.category || '').toLowerCase().includes(term)
    );
  }, [investigations, searchTerm]);

  // Calculate combined price for selected items
  const selectedTotal = useMemo(() => {
    let total = 0;
    for (const id of selectedIds) {
      const inv = investigations.find(i => (i.dbId || i.id) === id);
      if (inv) total += Number(inv.price) || 0;
    }
    return total;
  }, [selectedIds, investigations]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.size === 0 || isSubmitting) return;

    const pid = patientId || targetPatient?.id || appointment?.patientId;
    if (!pid) return;

    setIsSubmitting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await orderInvestigationsBatch(pid, ids, appointment);
      if (results) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Order Diagnostics Investigations" size="md">
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

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search investigations by name or category…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Investigation list */}
        <div
          className="rounded-xl border border-slate-200 overflow-y-auto"
          style={{ maxHeight: '300px' }}
        >
          {filteredInvestigations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {searchTerm ? 'No investigations match your search.' : 'No investigations available.'}
            </div>
          ) : (
            filteredInvestigations.map(inv => {
              const id = inv.dbId || inv.id;
              const isChecked = selectedIds.has(id);
              return (
                <label
                  key={id}
                  className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${
                    isChecked
                      ? 'bg-hospital-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelection(id)}
                    className="w-4 h-4 rounded accent-hospital-600 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{inv.testName}</div>
                    {inv.category && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {inv.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${isChecked ? 'text-hospital-700' : 'text-slate-500'}`}>
                    ₹{inv.price}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Selection summary bar */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className={`w-3.5 h-3.5 ${selectedIds.size > 0 ? 'text-hospital-600' : 'text-slate-300'}`} />
            <span>
              <span className="font-bold text-slate-700">{selectedIds.size}</span> selected
              {selectedIds.size > 0 && (
                <span className="ml-2 text-hospital-700 font-bold">· Est. ₹{selectedTotal}</span>
              )}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-400 hover:text-red-500 font-semibold transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
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
            disabled={selectedIds.size === 0 || isSubmitting}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-5 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ordering…</span>
              </>
            ) : (
              <span>
                {selectedIds.size === 0
                  ? 'Select Investigations'
                  : `Add ${selectedIds.size} Investigation${selectedIds.size > 1 ? 's' : ''}`}
              </span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderInvestigationModal;
