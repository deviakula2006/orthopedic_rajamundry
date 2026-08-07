import { useState, useEffect, useCallback } from 'react';
import {
  Bed,
  Building2,
  Plus,
  Trash2,
  LogOut,
  RefreshCw,
  Users,
  LayoutGrid,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AddWardModal from '../../components/modals/AddWardModal';
import AddBedModal from '../../components/modals/AddBedModal';
import AllocateBedModal from '../../components/modals/AllocateBedModal';
import apiClient from '../../services/api';

/* ============================================================
   BedManagement — self-contained page

   All API calls go directly to /api/bed-management/*.
   No dependency on HospitalContext for bed/ward state.
   Patients are loaded inside AllocateBedModal itself.
============================================================ */

const BedManagement = () => {
  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [addBedTarget, setAddBedTarget] = useState(null); // { id, name }
  const [selectedBed, setSelectedBed] = useState(null);   // full bed object + wardName
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bedDetailOpen, setBedDetailOpen] = useState(false);
  const [vacateConfirmOpen, setVacateConfirmOpen] = useState(false);
  const [deleteWardTarget, setDeleteWardTarget] = useState(null); // { id, name }
  const [deleteBedTarget, setDeleteBedTarget] = useState(null);   // { id, bedNumber, wardName }
  const [vacating, setVacating] = useState(false);

  // ---------------------------------------------------------------
  // Fetch wards (with embedded beds)
  // ---------------------------------------------------------------
  const fetchWards = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/bed-management/wards');
      setWards(res.data.data ?? []);
    } catch {
      setError('Failed to load ward data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  // ---------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------
  const totalWards = wards.length;
  const totalBeds = wards.reduce((sum, w) => sum + (w.beds?.length ?? 0), 0);
  const occupiedBeds = wards.reduce(
    (sum, w) => sum + (w.beds?.filter((b) => b.status === 'Occupied').length ?? 0),
    0
  );
  const vacantBeds = totalBeds - occupiedBeds;

  // ---------------------------------------------------------------
  // Bed click handler
  // ---------------------------------------------------------------
  const handleBedClick = (bed, ward) => {
    setSelectedBed({ ...bed, wardName: ward.name, wardId: ward.id });
    if (bed.status === 'Vacant') {
      setAssignModalOpen(true);
    } else {
      setBedDetailOpen(true);
    }
  };

  // ---------------------------------------------------------------
  // Vacate handler
  // ---------------------------------------------------------------
  const handleVacateConfirm = async () => {
    if (!selectedBed) return;
    setVacating(true);
    try {
      await apiClient.post(`/bed-management/beds/${selectedBed.id}/vacate`);
      setVacateConfirmOpen(false);
      setBedDetailOpen(false);
      setSelectedBed(null);
      await fetchWards();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to vacate bed'
      );
      setVacateConfirmOpen(false);
    } finally {
      setVacating(false);
    }
  };

  // ---------------------------------------------------------------
  // Delete bed handler
  // ---------------------------------------------------------------
  const handleDeleteBedConfirm = async () => {
    if (!deleteBedTarget) return;
    try {
      await apiClient.delete(`/bed-management/beds/${deleteBedTarget.id}`);
      setDeleteBedTarget(null);
      await fetchWards();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to delete bed'
      );
      setDeleteBedTarget(null);
    }
  };

  // ---------------------------------------------------------------
  // Delete ward handler
  // ---------------------------------------------------------------
  const handleDeleteWardConfirm = async () => {
    if (!deleteWardTarget) return;
    try {
      await apiClient.delete(`/bed-management/wards/${deleteWardTarget.id}`);
      setDeleteWardTarget(null);
      await fetchWards();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to delete ward'
      );
      setDeleteWardTarget(null);
    }
  };

  // ---------------------------------------------------------------
  // Bed card styling
  // ---------------------------------------------------------------
  const getBedStyle = (status) => {
    if (status === 'Occupied') {
      return {
        card: 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300',
        badge: 'bg-rose-100 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: 'text-rose-500'
      };
    }
    return {
      card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
      icon: 'text-emerald-500'
    };
  };

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6">

      {/* ─── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between border-b pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bed &amp; Ward Management</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Monitor ward capacity, assign patients, and manage discharges in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh */}
          <button
            type="button"
            onClick={fetchWards}
            disabled={loading}
            title="Refresh"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {/* Add Ward */}
          <button
            type="button"
            onClick={() => setWardModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-4 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
          >
            <Building2 className="h-4 w-4" />
            Add Ward
          </button>
        </div>
      </div>

      {/* ─── Stats Banner ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Wards',
            value: totalWards,
            icon: <Building2 className="h-5 w-5" />,
            color: 'bg-blue-50 text-blue-600 border-blue-100'
          },
          {
            label: 'Total Beds',
            value: totalBeds,
            icon: <LayoutGrid className="h-5 w-5" />,
            color: 'bg-slate-50 text-slate-600 border-slate-200'
          },
          {
            label: 'Occupied',
            value: occupiedBeds,
            icon: <Users className="h-5 w-5" />,
            color: 'bg-rose-50 text-rose-600 border-rose-100'
          },
          {
            label: 'Vacant',
            value: vacantBeds,
            icon: <CheckCircle2 className="h-5 w-5" />,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }
        ].map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-2xl border p-4 ${s.color}`}
          >
            <span className="opacity-70">{s.icon}</span>
            <div>
              <span className="block text-2xl font-extrabold leading-none">{s.value}</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Error banner ─────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Loading skeleton ─────────────────────────────────── */}
      {loading && wards.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
              <div className="h-4 w-40 bg-slate-200 rounded mb-5" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-28 rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty state ──────────────────────────────────────── */}
      {!loading && wards.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700">No Wards Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Click <strong>Add Ward</strong> above to create your first ward and start adding beds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWardModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-5 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer mt-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Ward
          </button>
        </div>
      )}

      {/* ─── Ward Cards ───────────────────────────────────────── */}
      {!loading && wards.length > 0 && (
        <div className="space-y-5">
          {wards.map((ward) => {
            const beds = ward.beds ?? [];
            return (
              <div
                key={ward.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Ward header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-hospital-500/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-hospital-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                        {ward.name}
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        ₹{Number(ward.dailyCharge).toLocaleString('en-IN')}/day
                        &nbsp;·&nbsp;
                        {beds.length} bed{beds.length !== 1 ? 's' : ''}
                        &nbsp;·&nbsp;
                        {ward.occupiedCount} occupied
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddBedTarget({ id: ward.id, name: ward.name })}
                      className="flex items-center gap-1 text-xs font-bold text-hospital-600 hover:text-hospital-700 bg-hospital-50 hover:bg-hospital-100 border border-hospital-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Bed
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteWardTarget({ id: ward.id, name: ward.name })}
                      title={beds.length > 0 ? 'Remove all beds first' : 'Delete ward'}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Beds grid */}
                <div className="p-5">
                  {beds.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Bed className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-400">
                        No beds in this ward yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setAddBedTarget({ id: ward.id, name: ward.name })}
                        className="text-xs font-bold text-hospital-600 hover:underline cursor-pointer"
                      >
                        + Add first bed
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {beds.map((bed) => {
                        const style = getBedStyle(bed.status);
                        return (
                          <button
                            key={bed.id}
                            type="button"
                            onClick={() => handleBedClick(bed, ward)}
                            className={`group relative flex flex-col items-start justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer h-32 ${style.card}`}
                          >
                            {/* Delete bed button — only shown on hover for vacant beds */}
                            {bed.status === 'Vacant' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteBedTarget({ id: bed.id, bedNumber: bed.bedNumber, wardName: ward.name });
                                }}
                                title="Delete bed"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all cursor-pointer z-10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}

                            {/* Top row */}
                            <div className="flex w-full items-start justify-between">
                              <span className={`h-2 w-2 rounded-full mt-0.5 ${style.dot}`} />
                              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${style.badge}`}>
                                {bed.bedNumber}
                              </span>
                            </div>

                            {/* Bottom content */}
                            <div className="w-full">
                              <Bed className={`h-5 w-5 mb-1 ${style.icon}`} />
                              {bed.status === 'Occupied' && bed.patient ? (
                                <>
                                  <span className="block text-xs font-extrabold text-slate-800 truncate leading-tight">
                                    {bed.patient.name}
                                  </span>
                                  <span className="block text-[9px] font-semibold text-slate-500 mt-0.5">
                                    {bed.patient.code}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="block text-xs font-bold text-emerald-700">
                                    Vacant
                                  </span>
                                  <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">
                                    Tap to assign
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ───────────────────────────────────────────── */}

      {/* Add Ward */}
      <AddWardModal
        isOpen={wardModalOpen}
        onClose={() => setWardModalOpen(false)}
        onSaved={async () => {
          setWardModalOpen(false);
          await fetchWards();
        }}
      />

      {/* Add Bed */}
      <AddBedModal
        isOpen={Boolean(addBedTarget)}
        onClose={() => setAddBedTarget(null)}
        wardId={addBedTarget?.id}
        wardName={addBedTarget?.name}
        onSaved={async () => {
          setAddBedTarget(null);
          await fetchWards();
        }}
      />

      {/* Assign Patient (vacant bed clicked) */}
      <AllocateBedModal
        isOpen={assignModalOpen}
        onClose={() => { setAssignModalOpen(false); setSelectedBed(null); }}
        bed={selectedBed}
        onSaved={async () => {
          setAssignModalOpen(false);
          setSelectedBed(null);
          await fetchWards();
        }}
      />

      {/* Occupied Bed Detail */}
      {selectedBed && (
        <Modal
          isOpen={bedDetailOpen}
          onClose={() => { setBedDetailOpen(false); setSelectedBed(null); }}
          title={`Bed ${selectedBed.bedNumber} — ${selectedBed.wardName}`}
          size="sm"
        >
          <div className="space-y-4 text-xs font-semibold text-slate-600">
            {/* Patient info */}
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">
                    {selectedBed.patient?.name ?? '—'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {selectedBed.patient?.code ?? ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider">Ward</span>
                  <span className="block text-slate-700 font-bold mt-0.5">{selectedBed.wardName}</span>
                </div>
                <div>
                  <span className="block text-slate-400 uppercase tracking-wider">Bed</span>
                  <span className="block text-slate-700 font-bold mt-0.5">{selectedBed.bedNumber}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-slate-400 uppercase tracking-wider">Admitted</span>
                  <span className="block text-slate-700 font-bold mt-0.5">
                    {selectedBed.admittedAt
                      ? new Date(selectedBed.admittedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBedDetailOpen(false);
                  setVacateConfirmOpen(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Vacate Bed
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vacate confirmation */}
      <ConfirmationModal
        isOpen={vacateConfirmOpen}
        onClose={() => setVacateConfirmOpen(false)}
        onConfirm={handleVacateConfirm}
        title="Vacate Bed"
        message={`Are you sure you want to discharge ${selectedBed?.patient?.name ?? 'the patient'} from Bed ${selectedBed?.bedNumber}? The bed will be marked Vacant immediately.`}
        confirmText={vacating ? 'Vacating…' : 'Yes, Vacate'}
        type="danger"
      />

      {/* Delete bed confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteBedTarget)}
        onClose={() => setDeleteBedTarget(null)}
        onConfirm={handleDeleteBedConfirm}
        title="Delete Bed"
        message={`Are you sure you want to permanently delete Bed "${deleteBedTarget?.bedNumber}" from ward "${deleteBedTarget?.wardName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />

      {/* Delete ward confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteWardTarget)}
        onClose={() => setDeleteWardTarget(null)}
        onConfirm={handleDeleteWardConfirm}
        title="Delete Ward"
        message={
          (wards.find((w) => w.id === deleteWardTarget?.id)?.beds?.length ?? 0) > 0
            ? `Ward "${deleteWardTarget?.name}" still has beds. Remove all beds first before deleting the ward.`
            : `Are you sure you want to permanently delete ward "${deleteWardTarget?.name}"? This cannot be undone.`
        }
        confirmText="Delete Ward"
        type="danger"
      />
    </div>
  );
};

export default BedManagement;
