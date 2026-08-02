import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import { Plus, Trash2 } from 'lucide-react';

const AddPrescriptionModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { addPrescription } = useHospital();
  
  const [medicines, setMedicines] = useState([
    { medicineName: '', dosage: '1 tablet', frequency: 'Twice Daily (1-0-1)', duration: '5 Days', notes: 'Take after food' }
  ]);

  const handleAddRow = () => {
    setMedicines([
      ...medicines,
      { medicineName: '', dosage: '1 tablet', frequency: 'Twice Daily (1-0-1)', duration: '5 Days', notes: 'Take after food' }
    ]);
  };

  const handleRemoveRow = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleChange = (idx, field, val) => {
    setMedicines(
      medicines.map((med, i) => (i === idx ? { ...med, [field]: val } : med))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validMedicines = medicines.filter((m) => m.medicineName.trim() !== '');
    if (validMedicines.length === 0) {
      alert('Please add at least one medicine name.');
      return;
    }
    await addPrescription(patientId, validMedicines);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Prescription" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {medicines.map((med, idx) => (
            <div key={idx} className="border border-slate-200 bg-slate-50/50 rounded-xl p-3.5 space-y-3 relative">
              {medicines.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="absolute right-3.5 top-3.5 text-rose-500 hover:text-rose-600 cursor-pointer"
                  title="Remove Medicine"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    required
                    value={med.medicineName}
                    onChange={(e) => handleChange(idx, 'medicineName', e.target.value)}
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    value={med.dosage}
                    onChange={(e) => handleChange(idx, 'dosage', e.target.value)}
                    placeholder="e.g. 1 tablet / 5ml"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Frequency
                  </label>
                  <select
                    value={med.frequency}
                    onChange={(e) => handleChange(idx, 'frequency', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none transition-all cursor-pointer shadow-inner"
                  >
                    <option value="Once Daily (1-0-0)">Once Daily (1-0-0)</option>
                    <option value="Twice Daily (1-0-1)">Twice Daily (1-0-1)</option>
                    <option value="Three Times Daily (1-1-1)">Three Times Daily (1-1-1)</option>
                    <option value="Four Times Daily (1-1-1-1)">Four Times Daily (1-1-1-1)</option>
                    <option value="As Needed (SOS)">As Needed (SOS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={med.duration}
                    onChange={(e) => handleChange(idx, 'duration', e.target.value)}
                    placeholder="e.g. 5 Days / 1 Week"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Instructions / Notes
                </label>
                <input
                  type="text"
                  value={med.notes}
                  onChange={(e) => handleChange(idx, 'notes', e.target.value)}
                  placeholder="e.g. Take after meals, dissolve in warm water"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1.5 text-xs font-bold text-hospital-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 py-2 px-4 rounded-xl cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 py-2 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
            >
              Save Prescription
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddPrescriptionModal;
