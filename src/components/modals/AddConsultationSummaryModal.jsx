import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';

const AddConsultationSummaryModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { addConsultationSummary } = useHospital();
  
  const [symptoms, setSymptoms] = useState('');
  const [findings, setFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert('Please enter a diagnosis.');
      return;
    }
    await addConsultationSummary(
      patientId, 
      { symptoms, findings, diagnosis, advice, followUp }
    );
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Consultation Summary" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Symptoms
          </label>
          <textarea
            required
            rows="2"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Severe knee pain, difficulty in flexion"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all resize-none shadow-inner"
          ></textarea>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Clinical Findings / Examination
          </label>
          <textarea
            required
            rows="2"
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
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
            required
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Osteoarthritis Right Knee"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-bold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Advice / Plan
          </label>
          <textarea
            required
            rows="2"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
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
            required
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
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
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer"
          >
            Save Summary
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddConsultationSummaryModal;
