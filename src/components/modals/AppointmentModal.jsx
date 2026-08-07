import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import Autocomplete from '../common/Autocomplete';

const AppointmentModal = ({ isOpen, onClose, appointment = null, initialPatientId = '' }) => {
  const { patients, doctors, addAppointment, editAppointment } = useHospital();

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [type, setType] = useState('Consultation');
  const [fee, setFee] = useState(500);

  const [prevApt, setPrevApt] = useState(appointment);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (prevApt !== appointment || prevOpen !== isOpen) {
    setPrevApt(appointment);
    setPrevOpen(isOpen);
    if (isOpen) {
      if (appointment) {
        setPatientId(appointment.patientId || '');
        setDoctorId(appointment.doctorId || '');
        setDate(appointment.date || '');
        setTime(appointment.time || '10:00 AM');
        setType(appointment.type || 'Consultation');
        setFee(appointment.fee || 500);
      } else {
        setPatientId(initialPatientId || '');
        setDoctorId('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime('10:00 AM');
        setType('Consultation');
        setFee(500);
      }
    }
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (!appointment) {
      if (newType === 'Therapy') setFee(600);
      else if (newType === 'Follow Up') setFee(300);
      else setFee(500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId || !doctorId || !date) return;

    const aptData = {
      patientId,
      doctorId,
      date,
      time,
      type,
      fee: parseInt(fee) || 0
    };

    if (appointment) {
      editAppointment(appointment.id, aptData);
    } else {
      addAppointment(aptData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={appointment ? 'Reschedule Appointment' : 'Schedule Orthopedic Checkup'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Patient
          </label>
          <Autocomplete
            options={patients}
            value={patientId}
            onChange={setPatientId}
            placeholder="Search patient by name..."
            displayKey="name"
            idKey="id"
          />
        </div>

        {/* Doctor Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Assigned Doctor Consultant
          </label>
          <Autocomplete
            options={doctors.filter((d) => d.status === 'Active')}
            value={doctorId}
            onChange={setDoctorId}
            placeholder="Search active doctor by name..."
            displayKey="name"
            idKey="id"
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduled Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduled Time (e.g. 10:00 AM)
            </label>
            <input
              type="text"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 10:00 AM, 02:30 PM"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>
        </div>

        {/* Type & Fee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Appointment Type
            </label>
            <select
              value={type}
              onChange={handleTypeChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            >
              <option value="Consultation">Consultation</option>
              <option value="Therapy">Physiotherapy Rehab</option>
              <option value="Follow Up">Follow Up Check</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Consultation Fee (INR)
            </label>
            <input
              type="number"
              required
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="500"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>
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
            {appointment ? 'Reschedule' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentModal;
