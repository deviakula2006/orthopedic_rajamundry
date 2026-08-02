import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';

const AddVitalsModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { addVitals } = useHospital();
  
  const [bp, setBp] = useState('120/80');
  const [sugar, setSugar] = useState('100');
  const [temp, setTemp] = useState('98.6');
  const [pulse, setPulse] = useState('72');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [spo2, setSpo2] = useState('98');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addVitals(
      patientId, 
      { bp, sugar, temp, pulse, weight, height, spo2 }
    );
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Patient Vitals" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Blood Pressure (mmHg)
            </label>
            <input
              type="text"
              required
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              placeholder="e.g. 120/80"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Blood Sugar (mg/dL)
            </label>
            <input
              type="number"
              required
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Body Temperature (°F)
            </label>
            <input
              type="text"
              required
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="e.g. 98.6"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Pulse Rate (bpm)
            </label>
            <input
              type="number"
              required
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="e.g. 72"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 170"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Oxygen Saturation SpO2 (%)
            </label>
            <input
              type="number"
              required
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              placeholder="e.g. 98"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
            Save Vitals
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVitalsModal;
