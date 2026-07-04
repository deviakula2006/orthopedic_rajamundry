import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from './AuthContext';
import { formatDisplayDate } from '../utils/formatDate';
import { timeAgo } from '../utils/timeAgo';

const HospitalContext = createContext(null);

// ---------------------------------------------------------------------------
// Adapters: backend row -> the shape every page already expects.
//
// The backend uses a UUID as the real primary key (`id`) plus a short
// human-readable `code` (PT001246, DOC001, ...). Every page component was
// built against the mock data, where that human-readable string *was* the
// `id` field. Rather than rewrite every page, these adapters keep exposing
// `id` as that display code, and carry the real UUID as a hidden `dbId` that
// only this context's CRUD functions use (to resolve a code back to the
// primary key right before calling the API).
// ---------------------------------------------------------------------------

const adaptPatient = (row) => ({
  id: row.code,
  dbId: row.id,
  name: row.name,
  age: row.age,
  gender: row.gender,
  phone: row.phone,
  address: row.address,
  bloodGroup: row.bloodGroup,
  disease: row.diagnosis,
  lastVisit: row.lastVisitDate ? formatDisplayDate(row.lastVisitDate) : '',
  // Raw ISO date, kept alongside the display-formatted `lastVisit` above so
  // Reports.jsx can actually filter by date range (formatted strings aren't comparable).
  lastVisitRaw: row.lastVisitDate || ''
});

const adaptDoctor = (row) => ({
  id: row.code,
  dbId: row.id,
  name: row.name,
  specialization: row.specialization,
  phone: row.phone,
  email: row.email,
  status: row.status,
  availability: row.availabilityNote || '',
  experience: row.experienceYears != null ? `${row.experienceYears} Years` : ''
});

const adaptReceptionist = (row) => ({
  id: row.code,
  dbId: row.id,
  name: row.name,
  phone: row.phone,
  email: row.email,
  shift: row.shift,
  status: row.status
});

const adaptInvestigation = (row) => ({
  id: row.code,
  dbId: row.id,
  testName: row.testName,
  category: row.category,
  price: row.price
});

const adaptAppointment = (row) => ({
  id: row.code,
  dbId: row.id,
  patientId: row.patient?.code,
  patientName: row.patient?.name,
  doctorId: row.doctor?.code,
  doctorName: row.doctor?.name,
  date: row.date,
  time: row.time ? row.time.slice(0, 5) : '',
  type: row.type,
  status: row.status,
  fee: row.fee
});

const adaptBed = (row) => ({
  bedNo: row.bedNo,
  dbId: row.id,
  ward: row.ward?.name,
  bedType: row.ward?.bedType,
  patientId: row.patient?.code || '',
  patientName: row.patient?.name || '',
  status: row.status
});

const adaptBill = (row) => ({
  invoiceNo: row.invoiceNo,
  dbId: row.id,
  patientId: row.patient?.code,
  patientName: row.patient?.name,
  date: row.billDate,
  billType: row.billType,
  doctorName: row.doctor?.name || '',
  paymentMode: row.paymentMode,
  paymentStatus: row.paymentStatus,
  items: row.items ? row.items.map((i) => ({ description: i.description, type: i.type, amount: i.amount })) : undefined,
  subTotal: row.subTotal,
  discount: row.discount,
  tax: row.tax,
  total: row.total
});

const adaptActivity = (row) => ({
  id: row.id,
  user: row.actorName,
  action: row.action,
  time: timeAgo(row.createdAt),
  type: row.type
});

const LIST_ALL = { params: { limit: 100 } };

export const HospitalProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [beds, setBeds] = useState([]);
  const [bills, setBills] = useState([]);
  const [activities, setActivities] = useState([]);
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const reportError = useCallback(
    (err, fallback) => {
      const message = err.response?.data?.error?.message || fallback;
      showToast(message, 'error');
    },
    [showToast]
  );

  const refreshActivities = useCallback(async () => {
    try {
      const res = await apiClient.get('/activities', { params: { limit: 20 } });
      setActivities(res.data.data.map(adaptActivity));
    } catch (err) {
      console.error('Failed to load activity feed', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [
        patientsRes,
        doctorsRes,
        receptionistsRes,
        investigationsRes,
        appointmentsRes,
        bedsRes,
        billsRes,
        hospitalSettingsRes
      ] = await Promise.all([
        apiClient.get('/patients', LIST_ALL),
        apiClient.get('/doctors', LIST_ALL),
        apiClient.get('/receptionists', LIST_ALL),
        apiClient.get('/investigations', LIST_ALL),
        apiClient.get('/appointments', LIST_ALL),
        apiClient.get('/beds'),
        apiClient.get('/bills', LIST_ALL),
        apiClient.get('/hospital-settings')
      ]);
      setPatients(patientsRes.data.data.map(adaptPatient));
      setDoctors(doctorsRes.data.data.map(adaptDoctor));
      setReceptionists(receptionistsRes.data.data.map(adaptReceptionist));
      setInvestigations(investigationsRes.data.data.map(adaptInvestigation));
      setAppointments(appointmentsRes.data.data.map(adaptAppointment));
      setBeds(bedsRes.data.data.map(adaptBed));
      setBills(billsRes.data.data.map(adaptBill));
      setHospitalSettings(hospitalSettingsRes.data.data);
      await refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to load hospital data. Please refresh.');
    }
  }, [refreshActivities, reportError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll();
    } else {
      setPatients([]);
      setDoctors([]);
      setReceptionists([]);
      setInvestigations([]);
      setAppointments([]);
      setBeds([]);
      setBills([]);
      setActivities([]);
      setHospitalSettings(null);
    }
  }, [isAuthenticated, fetchAll]);

  // ---------------- Patients ----------------
  const addPatient = async (patient) => {
    try {
      const res = await apiClient.post('/patients', {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        address: patient.address,
        diagnosis: patient.disease,
        lastVisitDate: new Date().toISOString().slice(0, 10)
      });
      const created = adaptPatient(res.data.data);
      setPatients((prev) => [created, ...prev]);
      showToast(`Patient ${created.name} added successfully!`);
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to add patient');
      return undefined;
    }
  };

  const editPatient = async (code, updatedPatient) => {
    const target = patients.find((p) => p.id === code);
    if (!target) return;
    try {
      const res = await apiClient.put(`/patients/${target.dbId}`, {
        name: updatedPatient.name,
        age: updatedPatient.age,
        gender: updatedPatient.gender,
        phone: updatedPatient.phone,
        bloodGroup: updatedPatient.bloodGroup,
        address: updatedPatient.address,
        diagnosis: updatedPatient.disease
      });
      const saved = adaptPatient(res.data.data);
      setPatients((prev) => prev.map((p) => (p.id === code ? saved : p)));
      showToast(`Patient ${saved.name} updated successfully!`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to update patient');
    }
  };

  const deletePatient = async (code) => {
    const target = patients.find((p) => p.id === code);
    if (!target) return;
    try {
      await apiClient.delete(`/patients/${target.dbId}`);
      setPatients((prev) => prev.filter((p) => p.id !== code));
      showToast('Patient record deleted.', 'warning');
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to delete patient');
    }
  };

  // ---------------- Doctors ----------------
  const parseExperienceYears = (value) => {
    const match = String(value ?? '').match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  };

  const addDoctor = async (doctor) => {
    try {
      const res = await apiClient.post('/doctors', {
        name: doctor.name,
        specialization: doctor.specialization,
        phone: doctor.phone,
        email: doctor.email,
        status: doctor.status,
        availabilityNote: doctor.availability,
        experienceYears: parseExperienceYears(doctor.experience)
      });
      const created = adaptDoctor(res.data.data);
      setDoctors((prev) => [...prev, created]);
      showToast(`Dr. ${created.name} added successfully!`);
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to add doctor');
      return undefined;
    }
  };

  const editDoctor = async (code, updatedDoctor) => {
    const target = doctors.find((d) => d.id === code);
    if (!target) return;
    try {
      const res = await apiClient.put(`/doctors/${target.dbId}`, {
        name: updatedDoctor.name,
        specialization: updatedDoctor.specialization,
        phone: updatedDoctor.phone,
        email: updatedDoctor.email,
        status: updatedDoctor.status,
        availabilityNote: updatedDoctor.availability,
        experienceYears: parseExperienceYears(updatedDoctor.experience)
      });
      const saved = adaptDoctor(res.data.data);
      setDoctors((prev) => prev.map((d) => (d.id === code ? saved : d)));
      showToast(`Dr. ${saved.name} details updated!`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to update doctor');
    }
  };

  const deleteDoctor = async (code) => {
    const target = doctors.find((d) => d.id === code);
    if (!target) return;
    try {
      await apiClient.delete(`/doctors/${target.dbId}`);
      setDoctors((prev) => prev.filter((d) => d.id !== code));
      showToast('Doctor removed.', 'warning');
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to remove doctor');
    }
  };

  const toggleDoctorStatus = async (code) => {
    const target = doctors.find((d) => d.id === code);
    if (!target) return;
    try {
      const res = await apiClient.patch(`/doctors/${target.dbId}/status`);
      const saved = adaptDoctor(res.data.data);
      setDoctors((prev) => prev.map((d) => (d.id === code ? saved : d)));
      showToast(`Dr. ${saved.name} is now ${saved.status}`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to update doctor status');
    }
  };

  // ---------------- Receptionists ----------------
  const addReceptionist = async (rec) => {
    try {
      const res = await apiClient.post('/receptionists', {
        name: rec.name,
        phone: rec.phone,
        email: rec.email,
        shift: rec.shift,
        status: rec.status
      });
      const created = adaptReceptionist(res.data.data);
      setReceptionists((prev) => [...prev, created]);
      showToast(`Receptionist ${created.name} registered!`);
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to register receptionist');
      return undefined;
    }
  };

  const editReceptionist = async (code, updatedRec) => {
    const target = receptionists.find((r) => r.id === code);
    if (!target) return;
    try {
      const res = await apiClient.put(`/receptionists/${target.dbId}`, {
        name: updatedRec.name,
        phone: updatedRec.phone,
        email: updatedRec.email,
        shift: updatedRec.shift,
        status: updatedRec.status
      });
      const saved = adaptReceptionist(res.data.data);
      setReceptionists((prev) => prev.map((r) => (r.id === code ? saved : r)));
      showToast('Receptionist details updated!');
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to update receptionist');
    }
  };

  const deleteReceptionist = async (code) => {
    const target = receptionists.find((r) => r.id === code);
    if (!target) return;
    try {
      await apiClient.delete(`/receptionists/${target.dbId}`);
      setReceptionists((prev) => prev.filter((r) => r.id !== code));
      showToast('Receptionist removed.', 'warning');
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to remove receptionist');
    }
  };

  // ---------------- Investigations ----------------
  const addInvestigation = async (inv) => {
    try {
      const res = await apiClient.post('/investigations', {
        testName: inv.testName,
        category: inv.category,
        price: inv.price
      });
      const created = adaptInvestigation(res.data.data);
      setInvestigations((prev) => [...prev, created]);
      showToast(`Investigation ${created.testName} added to directory!`);
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to add investigation');
      return undefined;
    }
  };

  const editInvestigation = async (code, updatedInv) => {
    const target = investigations.find((i) => i.id === code);
    if (!target) return;
    try {
      const res = await apiClient.put(`/investigations/${target.dbId}`, {
        testName: updatedInv.testName,
        category: updatedInv.category,
        price: updatedInv.price
      });
      const saved = adaptInvestigation(res.data.data);
      setInvestigations((prev) => prev.map((i) => (i.id === code ? saved : i)));
      showToast('Lab test updated successfully!');
    } catch (err) {
      reportError(err, 'Failed to update investigation');
    }
  };

  const deleteInvestigation = async (code) => {
    const target = investigations.find((i) => i.id === code);
    if (!target) return;
    try {
      await apiClient.delete(`/investigations/${target.dbId}`);
      setInvestigations((prev) => prev.filter((i) => i.id !== code));
      showToast('Lab test deleted.', 'warning');
    } catch (err) {
      reportError(err, 'Failed to delete investigation');
    }
  };

  // ---------------- Appointments ----------------
  const addAppointment = async (apt) => {
    const patient = patients.find((p) => p.id === apt.patientId);
    const doctor = doctors.find((d) => d.id === apt.doctorId);
    if (!patient || !doctor) {
      showToast('Select a valid patient and doctor.', 'error');
      return;
    }
    try {
      const res = await apiClient.post('/appointments', {
        patientId: patient.dbId,
        doctorId: doctor.dbId,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        type: apt.type,
        fee: apt.fee
      });
      const created = adaptAppointment(res.data.data);
      setAppointments((prev) => [...prev, created]);
      showToast('Appointment scheduled successfully!');
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to schedule appointment');
      return undefined;
    }
  };

  const editAppointment = async (code, updatedApt) => {
    const target = appointments.find((a) => a.id === code);
    const patient = patients.find((p) => p.id === updatedApt.patientId);
    const doctor = doctors.find((d) => d.id === updatedApt.doctorId);
    if (!target || !patient || !doctor) return;
    try {
      const res = await apiClient.put(`/appointments/${target.dbId}`, {
        patientId: patient.dbId,
        doctorId: doctor.dbId,
        appointmentDate: updatedApt.date,
        appointmentTime: updatedApt.time,
        type: updatedApt.type,
        fee: updatedApt.fee
      });
      const saved = adaptAppointment(res.data.data);
      setAppointments((prev) => prev.map((a) => (a.id === code ? saved : a)));
      showToast('Appointment details updated!');
    } catch (err) {
      reportError(err, 'Failed to update appointment');
    }
  };

  const updateAppointmentStatus = async (code, status) => {
    const target = appointments.find((a) => a.id === code);
    if (!target) return;
    try {
      const res = await apiClient.patch(`/appointments/${target.dbId}/status`, { status });
      const saved = adaptAppointment(res.data.data);
      setAppointments((prev) => prev.map((a) => (a.id === code ? saved : a)));
      showToast(`Appointment status changed to ${status}`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to update appointment status');
    }
  };

  // The backend never physically deletes appointments — it cancels them so
  // the doctor's schedule and audit trail stay intact. We mirror that here by
  // updating the row's status instead of removing it from local state.
  const deleteAppointment = async (code) => {
    const target = appointments.find((a) => a.id === code);
    if (!target) return;
    try {
      const res = await apiClient.delete(`/appointments/${target.dbId}`);
      const saved = adaptAppointment(res.data.data);
      setAppointments((prev) => prev.map((a) => (a.id === code ? saved : a)));
      showToast('Appointment cancelled.', 'warning');
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to cancel appointment');
    }
  };

  // ---------------- Beds ----------------
  const assignBed = async (bedNo, patientCode) => {
    const bed = beds.find((b) => b.bedNo === bedNo);
    const patient = patients.find((p) => p.id === patientCode);
    if (!bed || !patient) {
      showToast('Patient not found!', 'error');
      return;
    }
    try {
      const res = await apiClient.post(`/beds/${bed.dbId}/assign`, { patientId: patient.dbId });
      const saved = adaptBed(res.data.data);
      setBeds((prev) => prev.map((b) => (b.bedNo === bedNo ? saved : b)));
      showToast(`Bed ${bedNo} assigned to ${saved.patientName}`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to assign bed');
    }
  };

  const releaseBed = async (bedNo) => {
    const bed = beds.find((b) => b.bedNo === bedNo);
    if (!bed) return;
    try {
      const res = await apiClient.post(`/beds/${bed.dbId}/release`);
      const saved = adaptBed(res.data.data);
      setBeds((prev) => prev.map((b) => (b.bedNo === bedNo ? saved : b)));
      showToast(`Bed ${bedNo} is now vacant.`);
      refreshActivities();
    } catch (err) {
      reportError(err, 'Failed to release bed');
    }
  };

  // ---------------- Billing ----------------
  const addBill = async (bill) => {
    const patient = patients.find((p) => p.id === bill.patientId);
    if (!patient) {
      showToast('Select a valid patient.', 'error');
      return undefined;
    }
    const doctor = doctors.find((d) => d.id === bill.doctorId);
    try {
      const res = await apiClient.post('/bills', {
        patientId: patient.dbId,
        doctorId: doctor?.dbId,
        billType: bill.billType,
        paymentMode: bill.paymentMode,
        paymentStatus: bill.paymentStatus,
        discount: bill.discount,
        tax: bill.tax,
        items: bill.items.map((item) => ({
          description: item.description,
          itemType: item.type,
          amount: item.amount
        }))
      });
      const created = adaptBill(res.data.data);
      setBills((prev) => [created, ...prev]);
      showToast(`Invoice ${created.invoiceNo} generated!`);
      refreshActivities();
      return created;
    } catch (err) {
      reportError(err, 'Failed to generate invoice');
      return undefined;
    }
  };

  // Bill list rows don't include line items (kept out of the list payload for
  // size); fetch the full detail when a user actually opens an invoice.
  const getBillDetail = async (invoiceNo) => {
    const target = bills.find((b) => b.invoiceNo === invoiceNo);
    if (!target) return undefined;
    try {
      const res = await apiClient.get(`/bills/${target.dbId}`);
      return adaptBill(res.data.data);
    } catch (err) {
      reportError(err, 'Failed to load invoice details');
      return undefined;
    }
  };

  const updateBillStatus = async (invoiceNo, status) => {
    const target = bills.find((b) => b.invoiceNo === invoiceNo);
    if (!target) return;
    try {
      const res = await apiClient.patch(`/bills/${target.dbId}/status`, { paymentStatus: status });
      const saved = adaptBill(res.data.data);
      setBills((prev) => prev.map((b) => (b.invoiceNo === invoiceNo ? { ...saved, items: b.items } : b)));
      showToast(`Invoice ${invoiceNo} marked as ${status}`);
    } catch (err) {
      reportError(err, 'Failed to update invoice status');
    }
  };

  const updateHospitalSettings = async (data) => {
    try {
      const res = await apiClient.put('/hospital-settings', data);
      setHospitalSettings(res.data.data);
      showToast('Hospital organization details saved!');
      refreshActivities();
      return res.data.data;
    } catch (err) {
      reportError(err, 'Failed to save hospital details');
      return undefined;
    }
  };

  const value = {
    patients,
    doctors,
    receptionists,
    investigations,
    appointments,
    beds,
    bills,
    activities,
    hospitalSettings,
    toasts,
    showToast,
    addPatient,
    editPatient,
    deletePatient,
    addDoctor,
    editDoctor,
    deleteDoctor,
    toggleDoctorStatus,
    addReceptionist,
    editReceptionist,
    deleteReceptionist,
    addAppointment,
    editAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    addInvestigation,
    editInvestigation,
    deleteInvestigation,
    assignBed,
    releaseBed,
    addBill,
    getBillDetail,
    updateBillStatus,
    updateHospitalSettings
  };

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
