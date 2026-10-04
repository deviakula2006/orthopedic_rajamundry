import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';

const COMMON_CATEGORIES = [
  'Radiology',
  'Pathology',
  'Biochemistry',
  'Cardiology',
  'Orthopedic',
  'Hematology',
  'Microbiology',
  'General'
];

const InvestigationModal = ({ isOpen, onClose, investigation = null }) => {
  const { addInvestigation, editInvestigation } = useHospital();
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Radiology');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevInv, setPrevInv] = useState(investigation);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (prevInv !== investigation || prevOpen !== isOpen) {
    setPrevInv(investigation);
    setPrevOpen(isOpen);
    if (isOpen) {
      if (investigation) {
        setTestName(investigation.testName || '');
        const existingCat = investigation.category || 'Radiology';
        if (COMMON_CATEGORIES.includes(existingCat)) {
          setCategory(existingCat);
          setIsCustomCategory(false);
          setCustomCategory('');
        } else {
          setCategory('Other');
          setIsCustomCategory(true);
          setCustomCategory(existingCat);
        }
        setPrice(investigation.price != null ? String(investigation.price) : '');
      } else {
        setTestName('');
        setCategory('Radiology');
        setIsCustomCategory(false);
        setCustomCategory('');
        setPrice('');
      }
    }
  }

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setIsCustomCategory(true);
      setCategory('Other');
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? customCategory.trim() : category.trim();
    if (!testName.trim() || !finalCategory || price === '' || isSubmitting) return;

    const invData = {
      testName: testName.trim(),
      category: finalCategory,
      price: parseFloat(price) || 0
    };

    setIsSubmitting(true);
    try {
      let ok = false;
      if (investigation) {
        ok = await editInvestigation(investigation.id, invData);
      } else {
        const created = await addInvestigation(invData);
        ok = Boolean(created);
      }
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={investigation ? 'Edit Test Profile' : 'Add Diagnostics Test Profile'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Test Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Test Name
          </label>
          <input
            type="text"
            required
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="e.g. MRI - Knee Joint scan"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Category
          </label>
          <select
            value={isCustomCategory ? 'Other' : category}
            onChange={handleCategoryChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            required
          >
            {COMMON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Other">Other / Custom Category</option>
          </select>

          {isCustomCategory && (
            <input
              type="text"
              required
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter custom category name..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          )}
        </div>

        {/* Cost (INR) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Cost (INR)
          </label>
          <input
            type="number"
            required
            min="0"
            step="1"
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
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !testName.trim() || !(isCustomCategory ? customCategory.trim() : category.trim()) || price === ''}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{investigation ? 'Save Changes' : 'Add Test Profile'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InvestigationModal;
