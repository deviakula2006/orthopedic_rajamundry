import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import { User, Calendar, Activity, AlertCircle } from 'lucide-react';

const AddVitalsModal = ({ isOpen, onClose, patientId, appointment = null, onSuccess }) => {
  const { patients, addVitals } = useHospital();

  // All vital fields MUST initially be empty — no fake default measurements
  const [bp, setBp] = useState('');
  const [sugar, setSugar] = useState('');
  const [temp, setTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [spo2, setSpo2] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset to empty fields whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setBp('');
      setSugar('');
      setTemp('');
      setPulse('');
      setWeight('');
      setHeight('');
      setSpo2('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const targetPatient = useMemo(() => {
    if (!patientId && !appointment) return null;
    const pid = patientId || appointment?.patientId || appointment?.patientDbId || appointment?.patientCode;
    return patients.find((p) => p.id === pid || p.dbId === pid || p.code === pid) || null;
  }, [patients, patientId, appointment]);

  const calculatedBmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const hM = h / 100;
      return (w / (hM * hM)).toFixed(1);
    }
    return '';
  }, [weight, height]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Rule: Blood Pressure is strictly required
    if (!bp || !bp.trim()) {
      setErrorMessage('Blood pressure is required.');
      return;
    }

    if (isSubmitting) return;

    const pid = targetPatient?.dbId || targetPatient?.id || patientId || appointment?.patientDbId || appointment?.patientId;
    if (!pid) {
      setErrorMessage('Patient identifier is missing. Please select a patient.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addVitals(
        pid,
        {
          bp: bp.trim(),
          sugar: sugar ? sugar.trim() : undefined,
          temp: temp ? temp.trim() : undefined,
          pulse: pulse ? pulse.trim() : undefined,
          weight: weight ? weight.trim() : undefined,
          height: height ? height.trim() : undefined,
          spo2: spo2 ? spo2.trim() : undefined,
          bmi: calculatedBmi || undefined
        },
        appointment
      );
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientName = targetPatient?.name || appointment?.patientName || 'Patient';
  const patientCode = targetPatient?.id || targetPatient?.code || appointment?.patientId || '';
  const appointmentCode = appointment?.id || appointment?.code || '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Patient Vitals" size="md">
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

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Blood Pressure (MANDATORY) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Blood Pressure (mmHg) <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={bp}
              onChange={(e) => {
                setBp(e.target.value);
                setErrorMessage('');
              }}
              placeholder="e.g. 120/80"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Required</span>
          </div>

          {/* Blood Sugar (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Blood Sugar (mg/dL)
            </label>
            <input
              type="number"
              value={sugar}
              onChange={(e) => setSugar(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Body Temperature (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Body Temperature (°F)
            </label>
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              placeholder="e.g. 98.6"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Pulse Rate (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Pulse Rate (bpm)
            </label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              placeholder="e.g. 72"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Weight (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Height (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 170"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Oxygen SpO2 (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Oxygen SpO2 (%)
            </label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              placeholder="e.g. 98"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
            <span className="text-[10px] text-slate-400">Optional</span>
          </div>

          {/* Calculated BMI */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Calculated BMI
            </label>
            <div className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 px-3 text-xs font-bold text-hospital-700 flex items-center justify-between">
              <span>{calculatedBmi ? `${calculatedBmi} kg/m²` : '—'}</span>
              <Activity className="w-3.5 h-3.5 text-hospital-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 py-2 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Vitals</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVitalsModal;
