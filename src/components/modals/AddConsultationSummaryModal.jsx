import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import { AlertCircle } from 'lucide-react';

const AddConsultationSummaryModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { addConsultationSummary } = useHospital();
  
  const [symptoms, setSymptoms] = useState('');
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSymptoms('');
      setFindings('');
      setDiagnosis('');
      setAdvice('');
      setFollowUp('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = {
      symptoms: symptoms.trim(),
      findings: findings.trim(),
      diagnosis: diagnosis.trim(),
      advice: advice.trim(),
      followUp: followUp.trim()
    };

    const hasContent = Object.values(trimmed).some((val) => val.length > 0);
    if (!hasContent) {
      const msg = 'Please enter at least one consultation summary field.';
      setError(msg);
      alert(msg);
      return;
    }

    try {
      setIsSubmitting(true);
      await addConsultationSummary(
        patientId, 
        {
          symptoms: trimmed.symptoms,
          findings: trimmed.findings,
          diagnosis: trimmed.diagnosis,
          advice: trimmed.advice,
          followUp: trimmed.followUp
        }
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to save consultation summary');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consultation Summary" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Symptoms
          </label>
          <textarea
            rows="2"
            value={symptoms}
            onChange={(e) => { setSymptoms(e.target.value); setError(''); }}
            placeholder="e.g. Severe knee pain, difficulty in flexion"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
          ></textarea>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Clinical Findings / Examination
          </label>
          <textarea
            rows="2"
            value={findings}
            onChange={(e) => { setFindings(e.target.value); setError(''); }}
            placeholder="e.g. Medial joint tenderness, crepitus present, swelling"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
          ></textarea>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => { setDiagnosis(e.target.value); setError(''); }}
            placeholder="e.g. Osteoarthritis Right Knee"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Advice / Plan
          </label>
          <textarea
            rows="2"
            value={advice}
            onChange={(e) => { setAdvice(e.target.value); setError(''); }}
            placeholder="e.g. Light physiotherapy, avoid climbing stairs, knee support"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
          ></textarea>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Follow-up Instructions
          </label>
          <input
            type="text"
            value={followUp}
            onChange={(e) => { setFollowUp(e.target.value); setError(''); }}
            placeholder="e.g. Review in 15 days or SOS"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 py-2 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Summary'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConsultationSummaryModal;
