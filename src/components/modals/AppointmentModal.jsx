import { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useHospital } from '../../context/HospitalContext';
import Autocomplete from '../common/Autocomplete';
import {
  getNowInIST,
  formatTo12Hour,
  parseTimeComponents,
  composeTime12Hour,
  validateAppointmentDateTime
} from '../../utils/dateTime';
import { AlertCircle } from 'lucide-react';

const AppointmentModal = ({ isOpen, onClose, appointment = null, initialPatientId = '' }) => {
  const { patients, doctors, appointmentTypes, addAppointment, editAppointment } = useHospital();

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patientType, setPatientType] = useState('Outpatient');
  const [date, setDate] = useState('');

  // Structured time inputs: Hour + Minute + AM/PM
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState('AM');

  // Appointment Type & Fee
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [type, setType] = useState('Consultation');
  const [fee, setFee] = useState(500);

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute today's date in IST for min date attribute
  const todayIST = useMemo(() => getNowInIST().dateStr, []);

  // Filter available doctors
  const availableDoctors = useMemo(() => {
    return doctors.filter(
      (d) => d.status === 'Active' || (appointment && (d.id === appointment.doctorId || d.code === appointment.doctorId || d.dbId === appointment.doctorId))
    );
  }, [doctors, appointment]);

  // Compute next reasonable future time slot in IST
  const getNextAvailableSlot = () => {
    const current = getNowInIST();
    let nextTotalMinutes = current.totalMinutes + 30; // 30 minutes in future
    if (nextTotalMinutes >= 1440) nextTotalMinutes = 1439;

    let h = Math.floor(nextTotalMinutes / 60);
    const m = nextTotalMinutes % 60;
    const roundedM = Math.ceil(m / 5) * 5; // round to next 5 minutes
    const finalM = roundedM >= 60 ? 0 : roundedM;
    if (roundedM >= 60) h = (h + 1) % 24;

    const modifier = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour: String(h12).padStart(2, '0'),
      minute: String(finalM).padStart(2, '0'),
      ampm: modifier
    };
  };

  // Populate/reset state on open or appointment change
  useEffect(() => {
    if (!isOpen) {
      setValidationError('');
      return;
    }

    setValidationError('');

    if (appointment) {
      // Editing existing appointment
      setPatientId(appointment.patientCode || appointment.patientId || '');
      setDoctorId(appointment.doctorId || '');
      setPatientType(appointment.patientType || 'Outpatient');
      setDate(appointment.date || todayIST);

      const parsedTime = parseTimeComponents(appointment.time);
      setHour(parsedTime.hour.padStart(2, '0'));
      setMinute(parsedTime.minute.padStart(2, '0'));
      setAmpm(parsedTime.ampm);

      // Match appointment type
      const matchedType = appointmentTypes.find(
        (t) => t.id === appointment.appointmentTypeId || t.name.toLowerCase() === (appointment.type || '').toLowerCase()
      );
      if (matchedType) {
        setAppointmentTypeId(matchedType.id);
        setType(matchedType.name);
      } else {
        setAppointmentTypeId('');
        setType(appointment.type || 'Consultation');
      }
      setFee(appointment.fee ?? 500);
    } else {
      // Creating new appointment
      setPatientId(initialPatientId || '');
      setDoctorId('');
      setPatientType('Outpatient');
      setDate(todayIST);

      const slot = getNextAvailableSlot();
      setHour(slot.hour);
      setMinute(slot.minute);
      setAmpm(slot.ampm);

      // Default to first active appointment type or 'Consultation'
      const defaultType = appointmentTypes.find((t) => t.isActive && t.name.toLowerCase() === 'consultation') ||
                          appointmentTypes.find((t) => t.isActive) ||
                          appointmentTypes[0];

      if (defaultType) {
        setAppointmentTypeId(defaultType.id);
        setType(defaultType.name);
        setFee(defaultType.defaultFee ?? 500);
      } else {
        setAppointmentTypeId('');
        setType('Consultation');
        setFee(500);
      }
    }
  }, [isOpen, appointment, initialPatientId, appointmentTypes, todayIST]);

  // Handle appointment type change
  const handleTypeSelect = (e) => {
    const selectedId = e.target.value;
    setAppointmentTypeId(selectedId);

    const found = appointmentTypes.find((t) => t.id === selectedId);
    if (found) {
      setType(found.name);
      setFee(found.defaultFee);
    }
  };

  // Handle hour change with validation
  const handleHourChange = (e) => {
    let val = e.target.value;
    if (val === '') {
      setHour('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setHour(val.padStart(2, '0'));
      setValidationError('');
    }
  };

  // Handle minute change with validation
  const handleMinuteChange = (e) => {
    let val = e.target.value;
    if (val === '') {
      setMinute('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0 && num <= 59) {
      setMinute(val.padStart(2, '0'));
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!patientId) {
      setValidationError('Please select a patient.');
      return;
    }
    if (!doctorId) {
      setValidationError('Please select an assigned doctor consultant.');
      return;
    }
    if (!date) {
      setValidationError('Please select a scheduled date.');
      return;
    }

    // Validate hour and minute
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || h < 1 || h > 12) {
      setValidationError('Hour must be between 1 and 12.');
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setValidationError('Minute must be between 00 and 59.');
      return;
    }
    if (ampm !== 'AM' && ampm !== 'PM') {
      setValidationError('Please select AM or PM.');
      return;
    }

    const formattedTime = composeTime12Hour(hour, minute, ampm);

    // Validate Date and Time against IST
    const timeValidation = validateAppointmentDateTime({
      appointmentDate: date,
      appointmentTime: formattedTime
    });

    if (!timeValidation.valid) {
      setValidationError(timeValidation.error);
      return;
    }

    const aptData = {
      patientId,
      doctorId,
      patientType,
      date,
      time: formattedTime,
      appointmentTypeId: appointmentTypeId || undefined,
      type,
      fee: parseFloat(fee) || 0
    };

    setIsSubmitting(true);
    try {
      let ok = false;
      if (appointment) {
        ok = await editAppointment(appointment.id, aptData);
      } else {
        const created = await addAppointment(aptData);
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
      title={appointment ? 'Reschedule Appointment' : 'Schedule Orthopedic Checkup'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Select Patient <span className="text-red-500">*</span>
          </label>
          <Autocomplete
            options={patients}
            value={patientId}
            onChange={setPatientId}
            placeholder="Search patient by name or ID..."
            displayKey="name"
            idKey="id"
          />
        </div>

        {/* Doctor Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Assigned Doctor Consultant <span className="text-red-500">*</span>
          </label>
          <Autocomplete
            options={availableDoctors}
            value={doctorId}
            onChange={setDoctorId}
            placeholder="Search active doctor by name..."
            displayKey="name"
            idKey="id"
          />
        </div>

        {/* Patient Type (Inpatient / Outpatient) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Patient Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                patientType === 'Outpatient'
                  ? 'border-hospital-500 bg-hospital-50 text-hospital-700 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="patientType"
                value="Outpatient"
                checked={patientType === 'Outpatient'}
                onChange={() => setPatientType('Outpatient')}
                className="sr-only"
              />
              <span>Outpatient (OPD)</span>
            </label>

            <label
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                patientType === 'Inpatient'
                  ? 'border-hospital-500 bg-hospital-50 text-hospital-700 shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="patientType"
                value="Inpatient"
                checked={patientType === 'Inpatient'}
                onChange={() => setPatientType('Inpatient')}
                className="sr-only"
              />
              <span>Inpatient (IPD)</span>
            </label>
          </div>
        </div>

        {/* Date & Structured Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduled Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={todayIST}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setValidationError('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Scheduled Time (IST) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {/* Hour Input */}
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  max="12"
                  required
                  placeholder="HH"
                  value={hour}
                  onChange={handleHourChange}
                  className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-2 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
                />
              </div>

              <span className="font-bold text-slate-400">:</span>

              {/* Minute Input */}
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  required
                  placeholder="MM"
                  value={minute}
                  onChange={handleMinuteChange}
                  className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-2 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all"
                />
              </div>

              {/* AM / PM Select */}
              <div className="w-20">
                <select
                  value={ampm}
                  onChange={(e) => {
                    setAmpm(e.target.value);
                    setValidationError('');
                  }}
                  className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-2 text-sm font-bold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">12-hr format (e.g. 10 : 00 AM)</p>
          </div>
        </div>

        {/* Dynamically Configured Appointment Type & Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Appointment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={appointmentTypeId}
              onChange={handleTypeSelect}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all cursor-pointer"
            >
              {appointmentTypes.length === 0 && (
                <option value="">Loading types...</option>
              )}
              {appointmentTypes
                .filter((t) => t.isActive || (appointment && t.id === appointment.appointmentTypeId))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (₹{t.defaultFee})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Consultation Fee (INR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
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
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !patientId || !doctorId || !date}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{appointment ? 'Reschedule' : 'Book Appointment'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentModal;
