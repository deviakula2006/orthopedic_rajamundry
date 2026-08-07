import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { User, Search } from 'lucide-react';
import apiClient from '../../services/api';

/**
 * AllocateBedModal — Assign Patient to a Vacant Bed
 *
 * Standalone — fetches the patient list itself via /api/patients.
 * Does NOT depend on HospitalContext.
 *
 * Props:
 *   isOpen    {boolean}
 *   onClose   {() => void}
 *   bed       {object}   — { id, bedNumber, wardName }
 *   onSaved   {(bed) => void}  — called with updated bed on success
 */
const AllocateBedModal = ({ isOpen, onClose, bed, onSaved }) => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Load patients when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    setSearch('');
    setSelectedPatientId('');
    setError('');

    apiClient
      .get('/patients', { params: { limit: 200 } })
      .then((res) => {
        setPatients(res.data.data ?? []);
      })
      .catch(() => {
        setError('Could not load patients. Please try again.');
      })
      .finally(() => setFetching(false));
  }, [isOpen]);

  const handleClose = () => {
    setSearch('');
    setSelectedPatientId('');
    setError('');
    onClose();
  };

  const handleAssign = async () => {
    if (!selectedPatientId || !bed?.id) return;
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post(`/bed-management/beds/${bed.id}/assign`, {
        patientId: selectedPatientId
      });
      onSaved?.(res.data.data);
      handleClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to assign patient'
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter patients by search text
  const filtered = patients.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.code?.toLowerCase().includes(term) ||
      p.patient_code?.toLowerCase().includes(term)
    );
  });

  const selectedPatient = patients.find(
    (p) => p.id === selectedPatientId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Assign Patient — Bed ${bed?.bedNumber ?? ''}`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Bed info strip */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600">
          <span className="text-slate-400 uppercase tracking-wider">Ward</span>
          <span className="ml-2 text-slate-800">{bed?.wardName}</span>
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-slate-400 uppercase tracking-wider">Bed</span>
          <span className="ml-2 text-slate-800">{bed?.bedNumber}</span>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Patient
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedPatientId(''); }}
              placeholder="Search by name or ID…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Patient list */}
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {fetching && (
            <div className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
              Loading patients…
            </div>
          )}
          {!fetching && filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-400 font-semibold">
              {search ? 'No patients match your search.' : 'No patients found.'}
            </div>
          )}
          {!fetching &&
            filtered.map((p) => {
              const pid = p.id;
              const code = p.code || p.patient_code || '';
              const isSelected = selectedPatientId === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => setSelectedPatientId(pid)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-hospital-50 border-l-4 border-hospital-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-hospital-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <User className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-800">{p.name}</span>
                    <span className="block text-slate-400">{code}</span>
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-hospital-600 font-bold text-[10px] uppercase tracking-wider">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Selected preview */}
        {selectedPatient && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-700">
            Assigning <strong>{selectedPatient.name}</strong> to Bed <strong>{bed?.bedNumber}</strong>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || !selectedPatientId}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Assign Patient'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AllocateBedModal;
