import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Modal } from '../../components/ui/Modal';
import { Bed, UserPlus, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';

const BedManagement = () => {
  const { beds, patients, assignBed, releaseBed } = useHospital();

  const [selectedBed, setSelectedBed] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(false);
  const [patientId, setPatientId] = useState('');

  // Group beds by ward
  const wards = ['General Ward', 'Semi Private', 'Private Room', 'ICU'];

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    if (bed.status === 'Available') {
      setPatientId(patients[0]?.id || '');
      setIsAssignOpen(true);
    } else {
      setIsReleaseOpen(true);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!patientId) return;
    assignBed(selectedBed.bedNo, patientId);
    setIsAssignOpen(false);
  };

  const handleReleaseSubmit = () => {
    releaseBed(selectedBed.bedNo);
    setIsReleaseOpen(false);
  };

  const getBedColor = (status) => {
    return status === 'Occupied'
      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300';
  };

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
  const vacantBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Bed & Ward Management</h1>
          <p className="text-xs text-slate-400 font-semibold">Monitor bed availability and assign orthopedic admissions</p>
        </div>

        {/* Counters */}
        <div className="flex flex-wrap gap-4 text-xs font-bold">
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm min-w-36">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="text-slate-400 block uppercase">Vacant Beds</span>
              <span className="text-base font-extrabold text-slate-800">{vacantBeds} Available</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm min-w-36">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <div>
              <span className="text-slate-400 block uppercase">Occupied Beds</span>
              <span className="text-base font-extrabold text-slate-800">{occupiedBeds} Beds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Cards */}
      <div className="space-y-6">
        {wards.map((wardName) => {
          const wardBeds = beds.filter((b) => b.ward === wardName);
          return (
            <div key={wardName} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium">
              <h3 className="text-base font-bold text-slate-800 border-b pb-3 mb-5 uppercase tracking-wider">
                {wardName}
              </h3>
              
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
                {wardBeds.map((bed) => (
                  <button
                    key={bed.bedNo}
                    onClick={() => handleBedClick(bed)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer ${getBedColor(
                      bed.status
                    )}`}
                  >
                    <Bed className="h-6 w-6 mb-2" />
                    <span className="text-sm font-extrabold block">Bed {bed.bedNo}</span>
                    <span className="text-[10px] font-bold block uppercase tracking-wider mt-1">
                      {bed.status === 'Occupied' ? bed.patientName : 'Vacant'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Assign Bed */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title={`Assign Bed: ${selectedBed?.bedNo} (${selectedBed?.ward})`}>
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Admitting Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) - {p.disease}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-500 leading-relaxed">
            <span className="text-slate-700 font-bold block mb-1">Ward Category Allocation Info:</span>
            <p>Ward Name: <span className="text-slate-800 font-bold">{selectedBed?.ward}</span></p>
            <p>Room Type: <span className="text-slate-800 font-bold">{selectedBed?.bedType}</span></p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-hospital-500 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Admit Patient</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Discharge / Release Bed */}
      <Modal isOpen={isReleaseOpen} onClose={() => setIsReleaseOpen(false)} title={`Discharge Panel: Bed ${selectedBed?.bedNo}`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <span className="font-bold text-amber-950 uppercase block mb-0.5">Vacate Confirmation</span>
              <p>You are about to discharge patient <span className="font-extrabold text-slate-800">{selectedBed?.patientName}</span> and mark Bed <span className="font-extrabold text-slate-800">{selectedBed?.bedNo}</span> as vacant. Ensure billing clearances are complete.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p>Occupant Name: <span className="text-slate-800 font-extrabold">{selectedBed?.patientName}</span></p>
            <p>Occupant ID: <span className="text-slate-800 font-extrabold">{selectedBed?.patientId}</span></p>
            <p>Ward Allocation: <span className="text-slate-800 font-bold">{selectedBed?.ward}</span></p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReleaseOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReleaseSubmit}
              className="px-4 py-2 rounded-xl bg-red-600 text-sm font-bold text-white shadow-premium hover:bg-red-700 flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span>Confirm Discharge</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BedManagement;
