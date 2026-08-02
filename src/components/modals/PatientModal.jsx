import { useState } from 'react';
import { Modal } from '../ui/Modal';

const PatientModal = ({
  isOpen,
  onClose,
  onSave,
  patient = null
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [diagnosis, setDiagnosis] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevPatient, setPrevPatient] = useState(patient);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (prevPatient !== patient || prevOpen !== isOpen) {
    setPrevPatient(patient);
    setPrevOpen(isOpen);
    if (isOpen) {
      if (patient) {
        setName(patient.name || '');
        setPhone(patient.phone || '');
        setAge(patient.age ?? '');
        setGender(patient.gender || 'Male');
        setBloodGroup(patient.bloodGroup || 'O+');
        setDiagnosis(patient.diagnosis || '');
        setAddress(patient.address || '');
      } else {
        setName('');
        setPhone('');
        setAge('');
        setGender('Male');
        setBloodGroup('O+');
        setDiagnosis('');
        setAddress('');
      }
    }
  }

  const handleSubmit = async (e, bookAppointment = false) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || age === '') {
      return;
    }

    const patientData = {
      name: name.trim(),
      phone: phone.trim(),
      age: Number(age),
      gender,
      bloodGroup,
      diagnosis: diagnosis.trim(),
      address: address.trim()
    };

    setIsSubmitting(true);

    try {
      const result = await onSave(patientData, bookAppointment);

      if (result) {
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
      title={patient ? 'Edit Patient Details' : 'Register New Patient'}
      size="md"
    >
      <form
        onSubmit={(e) => handleSubmit(e, false)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Babu"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Phone Number
            </label>

            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Age
            </label>

            <input
              type="number"
              required
              min="0"
              max="150"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Gender
            </label>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Blood Group
            </label>

            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Diagnosis / Reason
          </label>

          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Osteoarthritis Knee, Ligament Tear ACL"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Home Address
          </label>

          <textarea
            rows="3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter home address details..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-4 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Save Patient'}
          </button>

          {!patient && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
              className="rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 hover:from-hospital-600 hover:to-cyanic-600 py-2.5 px-4 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save & Book Appointment'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default PatientModal;