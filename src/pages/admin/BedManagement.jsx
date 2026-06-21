import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Modal } from '../../components/ui/Modal';
import { Bed, UserPlus, LogOut, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Modals
import AllocateBedModal from '../../components/modals/AllocateBedModal';

const BedManagement = () => {
  const { beds, releaseBed } = useHospital();

  const [selectedBed, setSelectedBed] = useState(null);
  
  // Modals state
  const [bedDetailsOpen, setBedDetailsOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [dischargeConfirmOpen, setDischargeConfirmOpen] = useState(false);

  // Group beds by ward
  const wards = ['General Ward', 'Semi Private', 'Private Room', 'ICU'];

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    if (bed.status === 'Available') {
      setAllocateOpen(true);
    } else {
      setBedDetailsOpen(true);
    }
  };

  const triggerTransfer = () => {
    setBedDetailsOpen(false);
    setTransferOpen(true);
  };

  const triggerDischarge = () => {
    setBedDetailsOpen(false);
    setDischargeConfirmOpen(true);
  };

  const handleConfirmDischarge = () => {
    if (selectedBed) {
      releaseBed(selectedBed.bedNo);
      setSelectedBed(null);
    }
  };

  const getBedColor = (status) => {
    return status === 'Occupied'
      ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300';
  };

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
  const vacantBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-8">
      {/* Header & Stats Banner */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b pb-4">
        

        {/* Counters */}
        <div className="flex flex-wrap gap-4 text-xs font-bold">
          <div className="flex items-center gap-3 bg-white p-3 px-4 rounded-xl border border-slate-200 shadow-sm min-w-36">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <span className="text-slate-400 block uppercase">Vacant Beds</span>
              <span className="text-sm font-extrabold text-slate-800">{vacantBeds} Available</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 px-4 rounded-xl border border-slate-200 shadow-sm min-w-36">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <div>
              <span className="text-slate-400 block uppercase">Occupied Beds</span>
              <span className="text-sm font-extrabold text-slate-800">{occupiedBeds} Wards</span>
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
              <h3 className="text-xs font-extrabold text-slate-800 border-b pb-3 mb-5 uppercase tracking-wider">
                {wardName}
              </h3>

              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {wardBeds.map((bed) => (
                  <button
                    key={bed.bedNo}
                    type="button"
                    onClick={() => handleBedClick(bed)}
                    className={`flex flex-col items-start justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer h-36 ${getBedColor(
                      bed.status
                    )}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Bed className="h-5 w-5" />
                      <span className="text-xs font-extrabold uppercase bg-white/60 border rounded-lg px-2 py-0.5">
                        Bed {bed.bedNo}
                      </span>
                    </div>

                    {bed.status === 'Occupied' ? (
                      <div className="mt-2.5 w-full">
                        <span className="text-xs font-extrabold text-slate-800 block truncate">
                          {bed.patientName}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                          ID: {bed.patientId}
                        </span>
                        <span className="text-[8px] font-semibold text-slate-400 block mt-1">
                          Adm: {bed.admissionDate || 'Today'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2.5">
                        <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">
                          Vacant
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                          Ready for admission
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Bed Details & Actions */}
      <Modal isOpen={bedDetailsOpen} onClose={() => setBedDetailsOpen(false)} title={`Bed details: ${selectedBed?.bedNo}`} size="sm">
        {selectedBed && (
          <div className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-3 border-b pb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Bed No. {selectedBed.bedNo}</h4>
                <span className="text-[10px] text-slate-400 block mt-0.5">{selectedBed.ward} ({selectedBed.bedType})</span>
              </div>
            </div>

            <div className="py-2 border-b">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admitted Patient</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedBed.patientName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedBed.patientId}</p>
            </div>

            <div className="py-2 border-b">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admission Date</span>
              <p className="text-slate-800 mt-1">{selectedBed.admissionDate || 'Today'}</p>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="button"
                onClick={triggerTransfer}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfer Bed</span>
              </button>
              <button
                type="button"
                onClick={triggerDischarge}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Discharge Patient</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Allocate Bed */}
      {selectedBed && (
        <AllocateBedModal
          isOpen={allocateOpen}
          onClose={() => setAllocateOpen(false)}
          bedNo={selectedBed.bedNo}
          type="allocate"
        />
      )}

      {/* Modal: Transfer Bed */}
      {selectedBed && (
        <AllocateBedModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          bedNo={selectedBed.bedNo}
          type="transfer"
        />
      )}

      {/* Confirmation: Discharge Patient */}
      <ConfirmationModal
        isOpen={dischargeConfirmOpen}
        onClose={() => setDischargeConfirmOpen(false)}
        onConfirm={handleConfirmDischarge}
        title="Discharge Patient"
        message={`Are you sure you want to discharge patient ${selectedBed?.patientName} from Bed ${selectedBed?.bedNo}? Toggling this discharge will automatically release the bed back to the vacant list.`}
        confirmText="Discharge"
        type="danger"
      />
    </div>
  );
};

export default BedManagement;
