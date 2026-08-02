import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';

const InvestigationModal = ({ isOpen, onClose, investigation = null }) => {
  const { addInvestigation, editInvestigation } = useHospital();
  const [testName, setTestName] = useState('');
  const [price, setPrice] = useState('');

  const [prevInv, setPrevInv] = useState(investigation);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (prevInv !== investigation || prevOpen !== isOpen) {
    setPrevInv(investigation);
    setPrevOpen(isOpen);
    if (isOpen) {
      if (investigation) {
        setTestName(investigation.testName || '');
        setPrice(investigation.price || '');
      } else {
        setTestName('');
        setPrice('');
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!testName || !price) return;

    const invData = {
      testName,
      price: parseInt(price) || 0
    };

    if (investigation) {
      editInvestigation(investigation.id, invData);
    } else {
      addInvestigation(invData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={investigation ? 'Edit Lab Test Catalog' : 'Add Diagnostics Investigation Test'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Test Name
          </label>
          <input
            type="text"
            required
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. MRI - Knee joint scan"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Cost (INR)
          </label>
          <input
            type="number"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 1500"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
          />
        </div>

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
          >
            {investigation ? 'Save Changes' : 'Add Test'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InvestigationModal;
