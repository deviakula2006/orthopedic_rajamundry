import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_RECEPTIONISTS,
  INITIAL_INVESTIGATIONS,
  INITIAL_APPOINTMENTS,
  INITIAL_BEDS,
  INITIAL_BILLS,
  INITIAL_ACTIVITIES
} from '../constants/mockData';

const HospitalContext = createContext(null);

export const HospitalProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('roh_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [doctors, setDoctors] = useState(() => {
    const saved = localStorage.getItem('roh_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [receptionists, setReceptionists] = useState(() => {
    const saved = localStorage.getItem('roh_receptionists');
    return saved ? JSON.parse(saved) : INITIAL_RECEPTIONISTS;
  });

  const [investigations, setInvestigations] = useState(() => {
    const saved = localStorage.getItem('roh_investigations');
    return saved ? JSON.parse(saved) : INITIAL_INVESTIGATIONS;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('roh_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [beds, setBeds] = useState(() => {
    const saved = localStorage.getItem('roh_beds');
    return saved ? JSON.parse(saved) : INITIAL_BEDS;
  });

  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('roh_bills');
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('roh_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [toasts, setToasts] = useState([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('roh_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('roh_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('roh_receptionists', JSON.stringify(receptionists));
  }, [receptionists]);

  useEffect(() => {
    localStorage.setItem('roh_investigations', JSON.stringify(investigations));
  }, [investigations]);

  useEffect(() => {
    localStorage.setItem('roh_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('roh_beds', JSON.stringify(beds));
  }, [beds]);

  useEffect(() => {
    localStorage.setItem('roh_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('roh_activities', JSON.stringify(activities));
  }, [activities]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const addActivity = (action, type = 'general') => {
    const newActivity = {
      id: `ACT${Date.now()}`,
      user: 'Admin',
      action,
      time: 'Just now',
      type
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
  };

  // Patients CRUD
  const addPatient = (patient) => {
    const newPatient = {
      ...patient,
      id: patient.id || `PT00${1200 + patients.length + 1}`,
      lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setPatients((prev) => [newPatient, ...prev]);
    addActivity(`Registered new patient ${newPatient.name}`, 'patient');
    showToast(`Patient ${newPatient.name} added successfully!`);
    return newPatient;
  };

  const editPatient = (id, updatedPatient) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedPatient } : p)));
    addActivity(`Updated patient details for ${updatedPatient.name}`, 'patient');
    showToast(`Patient ${updatedPatient.name} updated successfully!`);
  };

  const deletePatient = (id) => {
    const p = patients.find((p) => p.id === id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (p) addActivity(`Removed patient record of ${p.name}`, 'patient');
    showToast(`Patient record deleted.`, 'warning');
  };

  // Doctors CRUD
  const addDoctor = (doctor) => {
    const newDoctor = {
      ...doctor,
      id: `DOC00${doctors.length + 1}`,
      status: doctor.status || 'Active'
    };
    setDoctors((prev) => [...prev, newDoctor]);
    addActivity(`Added Dr. ${newDoctor.name} to panel`, 'doctor');
    showToast(`Dr. ${newDoctor.name} added successfully!`);
  };

  const editDoctor = (id, updatedDoctor) => {
    setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updatedDoctor } : d)));
    addActivity(`Updated credentials of Dr. ${updatedDoctor.name}`, 'doctor');
    showToast(`Dr. ${updatedDoctor.name} details updated!`);
  };

  const deleteDoctor = (id) => {
    const d = doctors.find((doc) => doc.id === id);
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    if (d) addActivity(`Removed Dr. ${d.name} from doctors directory`, 'doctor');
    showToast(`Doctor removed.`, 'warning');
  };

  const toggleDoctorStatus = (id) => {
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const newStatus = d.status === 'Active' ? 'Inactive' : 'Active';
          addActivity(`Toggled status of Dr. ${d.name} to ${newStatus}`, 'doctor');
          showToast(`Dr. ${d.name} is now ${newStatus}`);
          return { ...d, status: newStatus };
        }
        return d;
      })
    );
  };

  // Receptionist CRUD
  const addReceptionist = (rec) => {
    const newRec = {
      ...rec,
      id: `REC00${receptionists.length + 1}`,
      status: 'Active'
    };
    setReceptionists((prev) => [...prev, newRec]);
    addActivity(`Hired receptionist ${newRec.name}`, 'receptionist');
    showToast(`Receptionist ${newRec.name} registered!`);
  };

  const editReceptionist = (id, updatedRec) => {
    setReceptionists((prev) => prev.map((r) => (r.id === id ? { ...r, ...updatedRec } : r)));
    addActivity(`Updated profile of receptionist ${updatedRec.name}`, 'receptionist');
    showToast(`Receptionist details updated!`);
  };

  const deleteReceptionist = (id) => {
    const r = receptionists.find((rec) => rec.id === id);
    setReceptionists((prev) => prev.filter((r) => r.id !== id));
    if (r) addActivity(`Terminated receptionist ${r.name} access`, 'receptionist');
    showToast(`Receptionist removed.`, 'warning');
  };

  // Appointments CRUD
  const addAppointment = (apt) => {
    const pat = patients.find((p) => p.id === apt.patientId) || { name: apt.patientName || 'New Patient' };
    const doc = doctors.find((d) => d.id === apt.doctorId) || { name: 'Assigned Doctor' };

    const newApt = {
      ...apt,
      id: `APT00${appointments.length + 1}`,
      patientName: pat.name,
      doctorName: doc.name,
      status: 'Scheduled',
      fee: apt.fee || 500
    };
    setAppointments((prev) => [...prev, newApt]);
    addActivity(`Booked appointment for ${pat.name} with ${doc.name}`, 'appointment');
    showToast(`Appointment scheduled successfully!`);
  };

  const editAppointment = (id, updatedApt) => {
    const pat = patients.find((p) => p.id === updatedApt.patientId) || { name: updatedApt.patientName };
    const doc = doctors.find((d) => d.id === updatedApt.doctorId) || { name: updatedApt.doctorName };

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...updatedApt,
              patientName: pat.name,
              doctorName: doc.name
            }
          : a
      )
    );
    showToast(`Appointment details updated!`);
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          addActivity(`Marked appointment ${id} as ${status}`, 'appointment');
          showToast(`Appointment status changed to ${status}`);
          return { ...a, status };
        }
        return a;
      })
    );
  };

  const deleteAppointment = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    addActivity(`Cancelled appointment reference ${id}`, 'appointment');
    showToast(`Appointment slot deleted.`, 'warning');
  };

  // Investigations CRUD
  const addInvestigation = (inv) => {
    const newInv = {
      ...inv,
      id: `INV00${investigations.length + 1}`
    };
    setInvestigations((prev) => [...prev, newInv]);
    addActivity(`Added investigation test: ${newInv.testName}`, 'medical');
    showToast(`Investigation ${newInv.testName} added to directory!`);
  };

  const editInvestigation = (id, updatedInv) => {
    setInvestigations((prev) => prev.map((i) => (i.id === id ? { ...i, ...updatedInv } : i)));
    showToast(`Lab test updated successfully!`);
  };

  const deleteInvestigation = (id) => {
    setInvestigations((prev) => prev.filter((i) => i.id !== id));
    showToast(`Lab test deleted.`, 'warning');
  };

  // Bed Allocation
  const assignBed = (bedNo, patientId) => {
    const p = patients.find((p) => p.id === patientId);
    if (!p) {
      showToast('Patient not found!', 'error');
      return;
    }
    setBeds((prev) =>
      prev.map((b) =>
        b.bedNo === bedNo ? { ...b, status: 'Occupied', patientId, patientName: p.name } : b
      )
    );
    addActivity(`Admitted ${p.name} to Ward Bed ${bedNo}`, 'bed');
    showToast(`Bed ${bedNo} assigned to ${p.name}`);
  };

  const releaseBed = (bedNo) => {
    const b = beds.find((bd) => bd.bedNo === bedNo);
    setBeds((prev) =>
      prev.map((b) =>
        b.bedNo === bedNo ? { ...b, status: 'Available', patientId: '', patientName: '' } : b
      )
    );
    if (b && b.patientName) {
      addActivity(`Discharged patient ${b.patientName} from Bed ${bedNo}`, 'bed');
      showToast(`Bed ${bedNo} is now vacant.`);
    }
  };

  // Billing CRUD
  const addBill = (bill) => {
    const newBill = {
      ...bill,
      invoiceNo: `INV-2026-00${bills.length + 1}`,
      date: new Date().toISOString().split('T')[0]
    };
    setBills((prev) => [newBill, ...prev]);
    addActivity(`Generated invoice ${newBill.invoiceNo} for ${newBill.patientName}`, 'billing');
    showToast(`Invoice ${newBill.invoiceNo} generated!`);
    return newBill;
  };

  const updateBillStatus = (invoiceNo, status) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.invoiceNo === invoiceNo) {
          showToast(`Invoice ${invoiceNo} marked as ${status}`);
          return { ...b, paymentStatus: status };
        }
        return b;
      })
    );
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
    updateBillStatus
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
