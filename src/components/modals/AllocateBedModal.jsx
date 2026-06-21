import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import Autocomplete from '../common/Autocomplete';

const AllocateBedModal = ({ isOpen, onClose, bedNo, type = 'allocate' }) => {
  const { patients, beds, assignBed, transferBed } = useHospital();
  const [patientId, setPatientId] = useState('');
  const [targetBedNo, setTargetBedNo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'allocate') {
      if (!patientId) return;
      assignBed(bedNo, patientId);
    } else if (type === 'transfer') {
      if (!targetBedNo) return;
      transferBed(bedNo, targetBedNo);
    }
    onClose();
  };

  const availableBeds = beds.filter((b) => b.status === 'Available');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'allocate' ? `Allocate Bed ${bedNo}` : `Transfer Patient from Bed ${bedNo}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'allocate' ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Admitted Patient
            </label>
            <Autocomplete
              options={patients}
              value={patientId}
              onChange={setPatientId}
              placeholder="Search patient to admit..."
              displayKey="name"
              idKey="id"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Target Available Bed
            </label>
            <select
              value={targetBedNo}
              onChange={(e) => setTargetBedNo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
              required
            >
              <option value="">-- Choose Bed --</option>
              {availableBeds.map((b) => (
                <option key={b.bedNo} value={b.bedNo}>
                  Bed {b.bedNo} ({b.ward} - {b.bedType})
                </option>
              ))}
            </select>
          </div>
        )}

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
            disabled={type === 'allocate' ? !patientId : !targetBedNo}
          >
            {type === 'allocate' ? 'Allocate Bed' : 'Transfer Patient'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AllocateBedModal;
