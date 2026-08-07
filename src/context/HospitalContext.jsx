// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { INITIAL_PATIENTS } from '../mock-data/patients';
// import { INITIAL_DOCTORS } from '../mock-data/doctors';
// import { INITIAL_RECEPTIONISTS } from '../mock-data/receptionists';
// import { INITIAL_APPOINTMENTS } from '../mock-data/appointments';
// import { INITIAL_INVESTIGATIONS } from '../mock-data/investigations';
// import { INITIAL_BILLS } from '../mock-data/bills';
// import { INITIAL_BEDS } from '../mock-data/beds';
// import { INITIAL_VISIT_HISTORY } from '../mock-data/visitHistory';
// import { INITIAL_ACTIVITIES } from '../constants/mockData';

// const HospitalContext = createContext(null);

// export const HospitalProvider = ({ children }) => {
//   const [patients, setPatients] = useState(() => {
//     const saved = localStorage.getItem('roh_patients');
//     return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
//   });

//   const [doctors, setDoctors] = useState(() => {
//     const saved = localStorage.getItem('roh_doctors');
//     return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
//   });

//   const [receptionists, setReceptionists] = useState(() => {
//     const saved = localStorage.getItem('roh_receptionists');
//     return saved ? JSON.parse(saved) : INITIAL_RECEPTIONISTS;
//   });

//   const [investigations, setInvestigations] = useState(() => {
//     const saved = localStorage.getItem('roh_investigations');
//     return saved ? JSON.parse(saved) : INITIAL_INVESTIGATIONS;
//   });

//   const [appointments, setAppointments] = useState(() => {
//     const saved = localStorage.getItem('roh_appointments');
//     return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
//   });

//   const [beds, setBeds] = useState(() => {
//     const saved = localStorage.getItem('roh_beds');
//     return saved ? JSON.parse(saved) : INITIAL_BEDS;
//   });

//   const [bills, setBills] = useState(() => {
//     const saved = localStorage.getItem('roh_bills');
//     return saved ? JSON.parse(saved) : INITIAL_BILLS;
//   });

//   const [activities, setActivities] = useState(() => {
//     const saved = localStorage.getItem('roh_activities');
//     return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
//   });

//   const [visitHistory, setVisitHistory] = useState(() => {
//     const saved = localStorage.getItem('roh_visit_history');
//     return saved ? JSON.parse(saved) : INITIAL_VISIT_HISTORY;
//   });

//   const [toasts, setToasts] = useState([]);

//   // Sync to LocalStorage
//   useEffect(() => {
//     localStorage.setItem('roh_patients', JSON.stringify(patients));
//   }, [patients]);

//   useEffect(() => {
//     localStorage.setItem('roh_doctors', JSON.stringify(doctors));
//   }, [doctors]);

//   useEffect(() => {
//     localStorage.setItem('roh_receptionists', JSON.stringify(receptionists));
//   }, [receptionists]);

//   useEffect(() => {
//     localStorage.setItem('roh_investigations', JSON.stringify(investigations));
//   }, [investigations]);

//   useEffect(() => {
//     localStorage.setItem('roh_appointments', JSON.stringify(appointments));
//   }, [appointments]);

//   useEffect(() => {
//     localStorage.setItem('roh_beds', JSON.stringify(beds));
//   }, [beds]);

//   useEffect(() => {
//     localStorage.setItem('roh_bills', JSON.stringify(bills));
//   }, [bills]);

//   useEffect(() => {
//     localStorage.setItem('roh_activities', JSON.stringify(activities));
//   }, [activities]);

//   // Toast Helper
//   const showToast = (message, type = 'success') => {
//     const id = Date.now();
//     setToasts((prev) => [...prev, { id, message, type }]);
//     setTimeout(() => {
//       setToasts((prev) => prev.filter((t) => t.id !== id));
//     }, 4000);
//   };

//   const addActivity = (action, type = 'general') => {
//     const newActivity = {
//       id: `ACT${Date.now()}`,
//       user: 'Admin',
//       action,
//       time: 'Just now',
//       type
//     };
//     setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
//   };

//   // Patients CRUD
//   const addPatient = (patient) => {
//     const newPatient = {
//       ...patient,
//       id: patient.id || `PT00${1200 + patients.length + 1}`,
//       lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
//     };
//     setPatients((prev) => [newPatient, ...prev]);
//     addActivity(`Registered new patient ${newPatient.name}`, 'patient');
//     showToast(`Patient ${newPatient.name} added successfully!`);
//     return newPatient;
//   };

//   const editPatient = (id, updatedPatient) => {
//     setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedPatient } : p)));
//     addActivity(`Updated patient details for ${updatedPatient.name}`, 'patient');
//     showToast(`Patient ${updatedPatient.name} updated successfully!`);
//   };

//   const deletePatient = (id) => {
//     const p = patients.find((p) => p.id === id);
//     setPatients((prev) => prev.filter((p) => p.id !== id));
//     if (p) addActivity(`Removed patient record of ${p.name}`, 'patient');
//     showToast(`Patient record deleted.`, 'warning');
//   };

//   // Doctors CRUD
//   const addDoctor = (doctor) => {
//     const newDoctor = {
//       ...doctor,
//       id: `DOC00${doctors.length + 1}`,
//       status: doctor.status || 'Active'
//     };
//     setDoctors((prev) => [...prev, newDoctor]);
//     addActivity(`Added Dr. ${newDoctor.name} to panel`, 'doctor');
//     showToast(`Dr. ${newDoctor.name} added successfully!`);
//   };

//   const editDoctor = (id, updatedDoctor) => {
//     setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...updatedDoctor } : d)));
//     addActivity(`Updated credentials of Dr. ${updatedDoctor.name}`, 'doctor');
//     showToast(`Dr. ${updatedDoctor.name} details updated!`);
//   };

//   const deleteDoctor = (id) => {
//     const d = doctors.find((doc) => doc.id === id);
//     setDoctors((prev) => prev.filter((d) => d.id !== id));
//     if (d) addActivity(`Removed Dr. ${d.name} from doctors directory`, 'doctor');
//     showToast(`Doctor removed.`, 'warning');
//   };

//   const toggleDoctorStatus = (id) => {
//     setDoctors((prev) =>
//       prev.map((d) => {
//         if (d.id === id) {
//           const newStatus = d.status === 'Active' ? 'Inactive' : 'Active';
//           addActivity(`Toggled status of Dr. ${d.name} to ${newStatus}`, 'doctor');
//           showToast(`Dr. ${d.name} is now ${newStatus}`);
//           return { ...d, status: newStatus };
//         }
//         return d;
//       })
//     );
//   };

//   // Receptionist CRUD
//   const addReceptionist = (rec) => {
//     const newRec = {
//       ...rec,
//       id: `REC00${receptionists.length + 1}`,
//       status: 'Active'
//     };
//     setReceptionists((prev) => [...prev, newRec]);
//     addActivity(`Hired receptionist ${newRec.name}`, 'receptionist');
//     showToast(`Receptionist ${newRec.name} registered!`);
//   };

//   const editReceptionist = (id, updatedRec) => {
//     setReceptionists((prev) => prev.map((r) => (r.id === id ? { ...r, ...updatedRec } : r)));
//     addActivity(`Updated profile of receptionist ${updatedRec.name}`, 'receptionist');
//     showToast(`Receptionist details updated!`);
//   };

//   const deleteReceptionist = (id) => {
//     const r = receptionists.find((rec) => rec.id === id);
//     setReceptionists((prev) => prev.filter((r) => r.id !== id));
//     if (r) addActivity(`Terminated receptionist ${r.name} access`, 'receptionist');
//     showToast(`Receptionist removed.`, 'warning');
//   };

//   // Appointments CRUD
//   const addAppointment = (apt) => {
//     const pat = patients.find((p) => p.id === apt.patientId) || { name: apt.patientName || 'New Patient' };
//     const doc = doctors.find((d) => d.id === apt.doctorId) || { name: 'Assigned Doctor' };

//     const newApt = {
//       ...apt,
//       id: `APT00${appointments.length + 1}`,
//       patientName: pat.name,
//       doctorName: doc.name,
//       status: 'Scheduled',
//       fee: apt.fee || 500
//     };
//     setAppointments((prev) => [...prev, newApt]);
//     addActivity(`Booked appointment for ${pat.name} with ${doc.name}`, 'appointment');
//     showToast(`Appointment scheduled successfully!`);
//   };

//   const editAppointment = (id, updatedApt) => {
//     const pat = patients.find((p) => p.id === updatedApt.patientId) || { name: updatedApt.patientName };
//     const doc = doctors.find((d) => d.id === updatedApt.doctorId) || { name: updatedApt.doctorName };

//     setAppointments((prev) =>
//       prev.map((a) =>
//         a.id === id
//           ? {
//               ...a,
//               ...updatedApt,
//               patientName: pat.name,
//               doctorName: doc.name
//             }
//           : a
//       )
//     );
//     showToast(`Appointment details updated!`);
//   };

//   const updateAppointmentStatus = (id, status) => {
//     setAppointments((prev) =>
//       prev.map((a) => {
//         if (a.id === id) {
//           addActivity(`Marked appointment ${id} as ${status}`, 'appointment');
//           showToast(`Appointment status changed to ${status}`);
//           return { ...a, status };
//         }
//         return a;
//       })
//     );
//   };

//   const deleteAppointment = (id) => {
//     setAppointments((prev) => prev.filter((a) => a.id !== id));
//     addActivity(`Cancelled appointment reference ${id}`, 'appointment');
//     showToast(`Appointment slot deleted.`, 'warning');
//   };

//   // Investigations CRUD
//   const addInvestigation = (inv) => {
//     const newInv = {
//       ...inv,
//       id: `INV00${investigations.length + 1}`
//     };
//     setInvestigations((prev) => [...prev, newInv]);
//     addActivity(`Added investigation test: ${newInv.testName}`, 'medical');
//     showToast(`Investigation ${newInv.testName} added to directory!`);
//   };

//   const editInvestigation = (id, updatedInv) => {
//     setInvestigations((prev) => prev.map((i) => (i.id === id ? { ...i, ...updatedInv } : i)));
//     showToast(`Lab test updated successfully!`);
//   };

//   const deleteInvestigation = (id) => {
//     setInvestigations((prev) => prev.filter((i) => i.id !== id));
//     showToast(`Lab test deleted.`, 'warning');
//   };

//   // Bed Allocation
//   const assignBed = (bedNo, patientId, dateStr) => {
//     const p = patients.find((p) => p.id === patientId);
//     if (!p) {
//       showToast('Patient not found!', 'error');
//       return;
//     }
//     const admissionDate = dateStr || new Date().toISOString().split('T')[0];
//     setBeds((prev) =>
//       prev.map((b) =>
//         b.bedNo === bedNo
//           ? {
//               ...b,
//               status: 'Occupied',
//               patientId,
//               patientName: p.name,
//               admissionDate
//             }
//           : b
//       )
//     );
//     addActivity(`Admitted ${p.name} to Ward Bed ${bedNo}`, 'bed');
//     showToast(`Bed ${bedNo} allocated to ${p.name} successfully!`);
//   };

//   const transferBed = (bedNo, newBedNo) => {
//     const currentBed = beds.find((b) => b.bedNo === bedNo);
//     if (!currentBed || currentBed.status !== 'Occupied') {
//       showToast('Source bed is not occupied!', 'error');
//       return;
//     }
//     const targetBed = beds.find((b) => b.bedNo === newBedNo);
//     if (!targetBed || targetBed.status !== 'Available') {
//       showToast('Target bed is not available!', 'error');
//       return;
//     }

//     setBeds((prev) =>
//       prev.map((b) => {
//         if (b.bedNo === bedNo) {
//           return {
//             ...b,
//             status: 'Available',
//             patientId: '',
//             patientName: '',
//             admissionDate: ''
//           };
//         }
//         if (b.bedNo === newBedNo) {
//           return {
//             ...b,
//             status: 'Occupied',
//             patientId: currentBed.patientId,
//             patientName: currentBed.patientName,
//             admissionDate: currentBed.admissionDate || new Date().toISOString().split('T')[0]
//           };
//         }
//         return b;
//       })
//     );
//     addActivity(
//       `Transferred patient ${currentBed.patientName} from Bed ${bedNo} to Bed ${newBedNo}`,
//       'bed'
//     );
//     showToast(`Patient transferred from Bed ${bedNo} to Bed ${newBedNo} successfully!`);
//   };

//   const releaseBed = (bedNo) => {
//     const b = beds.find((bd) => bd.bedNo === bedNo);
//     setBeds((prev) =>
//       prev.map((b) =>
//         b.bedNo === bedNo
//           ? { ...b, status: 'Available', patientId: '', patientName: '', admissionDate: '' }
//           : b
//       )
//     );
//     if (b && b.patientName) {
//       addActivity(`Discharged patient ${b.patientName} from Bed ${bedNo}`, 'bed');
//       showToast(`Discharged ${b.patientName}. Bed ${bedNo} is now vacant.`);
//     }
//   };

//   // Get or Create Today's Visit helper
//   const getOrCreateTodayVisit = (prevHistory, patientId, doctorName = 'Dr. Arjun Kumar') => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const patientRecord = prevHistory.find((r) => r.patientId === patientId);

//     const emptyVisit = {
//       id: `VIS-${Date.now()}`,
//       visitDate: todayStr,
//       appointmentId: '', 
//       doctorName,
//       doctorId: 'DOC001',
//       appointmentType: 'Consultation',
//       billRefNo: '',
//       vitals: [],
//       investigations: [],
//       prescriptions: [],
//       summary: null
//     };

//     if (patientRecord) {
//       const todayVisit = patientRecord.visits.find((v) => v.visitDate === todayStr);
//       if (todayVisit) {
//         return prevHistory;
//       } else {
//         return prevHistory.map((r) => {
//           if (r.patientId === patientId) {
//             return {
//               ...r,
//               visits: [emptyVisit, ...r.visits]
//             };
//           }
//           return r;
//         });
//       }
//     } else {
//       return [
//         {
//           patientId,
//           visits: [emptyVisit]
//         },
//         ...prevHistory
//       ];
//     }
//   };

//   // Vitals & Clinical History EMR Workflows
//   const addVitals = (patientId, vitals, addedBy = 'Dr. Arjun Kumar') => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
//     setVisitHistory((prev) => {
//       const initialized = getOrCreateTodayVisit(prev, patientId, addedBy);
//       return initialized.map((r) => {
//         if (r.patientId === patientId) {
//           return {
//             ...r,
//             visits: r.visits.map((v) =>
//               v.visitDate === todayStr
//                 ? {
//                     ...v,
//                     vitals: [
//                       ...(v.vitals || []),
//                       {
//                         time: currentTime,
//                         date: todayStr,
//                         addedBy,
//                         ...vitals
//                       }
//                     ]
//                   }
//                 : v
//             )
//           };
//         }
//         return r;
//       });
//     });
//     addActivity(`Recorded vitals for patient ${patientId}`, 'medical');
//     showToast(`Vitals recorded successfully!`);
//   };

//   const orderInvestigation = (patientId, test, orderedBy = 'Dr. Arjun Kumar') => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//     const newOrder = {
//       testId: test.id || `INV-${Date.now()}`,
//       testName: test.testName,
//       orderedBy,
//       orderedDate: todayStr,
//       orderedTime: currentTime,
//       status: 'Ordered'
//     };

//     setVisitHistory((prev) => {
//       const initialized = getOrCreateTodayVisit(prev, patientId, orderedBy);
//       return initialized.map((r) => {
//         if (r.patientId === patientId) {
//           return {
//             ...r,
//             visits: r.visits.map((v) =>
//               v.visitDate === todayStr
//                 ? {
//                     ...v,
//                     investigations: [
//                       ...(v.investigations || []),
//                       newOrder
//                     ]
//                   }
//                 : v
//             )
//           };
//         }
//         return r;
//       });
//     });
//     addActivity(`Ordered investigation ${test.testName} for patient ${patientId}`, 'medical');
//     showToast(`Investigation ordered successfully!`);
//   };

//   const addPrescription = (patientId, prescriptionList, addedBy = 'Dr. Arjun Kumar') => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

//     const newRxItems = prescriptionList.map((item) => ({
//       ...item,
//       addedBy,
//       date: todayStr,
//       time: currentTime
//     }));

//     setVisitHistory((prev) => {
//       const initialized = getOrCreateTodayVisit(prev, patientId, addedBy);
//       return initialized.map((r) => {
//         if (r.patientId === patientId) {
//           return {
//             ...r,
//             visits: r.visits.map((v) =>
//               v.visitDate === todayStr
//                 ? {
//                     ...v,
//                     prescriptions: [
//                       ...(v.prescriptions || []),
//                       ...newRxItems
//                     ]
//                   }
//                 : v
//             )
//           };
//         }
//         return r;
//       });
//     });
//     showToast(`Prescription saved successfully!`);
//   };

//   const addConsultationSummary = (patientId, summary, addedBy = 'Dr. Arjun Kumar') => {
//     const todayStr = new Date().toISOString().split('T')[0];
//     const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

//     const newSummary = {
//       ...summary,
//       addedBy,
//       date: todayStr,
//       time: currentTime
//     };

//     setVisitHistory((prev) => {
//       const initialized = getOrCreateTodayVisit(prev, patientId, addedBy);
//       return initialized.map((r) => {
//         if (r.patientId === patientId) {
//           return {
//             ...r,
//             visits: r.visits.map((v) =>
//               v.visitDate === todayStr
//                 ? {
//                     ...v,
//                     summary: newSummary
//                   }
//                 : v
//             )
//           };
//         }
//         return r;
//       });
//     });

//     setPatients((prev) =>
//       prev.map((p) => (p.id === patientId ? { ...p, disease: summary.diagnosis } : p))
//     );

//     showToast(`Consultation summary saved!`);
//   };

//   const addConsultationNotes = (patientId, notes, doctorName = 'Dr. Arjun Kumar') => {
//     addConsultationSummary(patientId, {
//       symptoms: 'Follow-up consultation notes recorded.',
//       findings: 'Regular examination.',
//       diagnosis: 'Osteoarthritis Knee',
//       advice: notes,
//       followUp: 'As advised'
//     }, doctorName);
//   };

//   // Billing CRUD
//   const addBill = (bill) => {
//     const newBill = {
//       ...bill,
//       invoiceNo: `INV-2026-00${bills.length + 1}`,
//       date: new Date().toISOString().split('T')[0]
//     };
//     setBills((prev) => [newBill, ...prev]);
//     addActivity(`Generated invoice ${newBill.invoiceNo} for ${newBill.patientName}`, 'billing');
//     showToast(`Invoice ${newBill.invoiceNo} generated!`);
//     return newBill;
//   };

//   const updateBillStatus = (invoiceNo, status) => {
//     setBills((prev) =>
//       prev.map((b) => {
//         if (b.invoiceNo === invoiceNo) {
//           showToast(`Invoice ${invoiceNo} marked as ${status}`);
//           return { ...b, paymentStatus: status };
//         }
//         return b;
//       })
//     );
//   };

//   const value = {
//     patients,
//     doctors,
//     receptionists,
//     investigations,
//     appointments,
//     beds,
//     bills,
//     activities,
//     visitHistory,
//     toasts,
//     showToast,
//     addPatient,
//     editPatient,
//     deletePatient,
//     addDoctor,
//     editDoctor,
//     deleteDoctor,
//     toggleDoctorStatus,
//     addReceptionist,
//     editReceptionist,
//     deleteReceptionist,
//     addAppointment,
//     editAppointment,
//     updateAppointmentStatus,
//     deleteAppointment,
//     addInvestigation,
//     editInvestigation,
//     deleteInvestigation,
//     assignBed,
//     transferBed,
//     releaseBed,
//     addVitals,
//     orderInvestigation,
//     addPrescription,
//     addConsultationSummary,
//     addConsultationNotes,
//     addBill,
//     updateBillStatus
//   };

//   return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
// };

// export const useHospital = () => {
//   const context = useContext(HospitalContext);
//   if (!context) {
//     throw new Error('useHospital must be used within a HospitalProvider');
//   }
//   return context;
// };

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import apiClient from '../services/api';
import { useAuth } from './AuthContext';
import { formatDisplayDate } from '../utils/formatDate';
import { timeAgo } from '../utils/timeAgo';

const HospitalContext = createContext(null);

/* ============================================================================
   BACKEND -> FRONTEND ADAPTERS

   Backend rows use UUID primary keys.

   Existing frontend pages were built using human-readable codes such as:
   PT001, DOC001, REC001, APT001, etc.

   Therefore:
   - id   = frontend/display code
   - dbId = real PostgreSQL UUID
============================================================================ */

const adaptPatient = (row) => ({
  id: row.code,
  dbId: row.id,
  code: row.code,
  name: row.name,
  age: row.age,
  gender: row.gender,
  phone: row.phone,
  address: row.address,
  bloodGroup: row.bloodGroup,
  disease: row.diagnosis,
  diagnosis: row.diagnosis,

  lastVisit: row.lastVisitDate
    ? formatDisplayDate(row.lastVisitDate)
    : '',

  lastVisitRaw: row.lastVisitDate || ''
});

const adaptDoctor = (row) => ({
  id: row.code,
  dbId: row.id,
  code: row.code,
  name: row.name,
  specialization: row.specialization,
  phone: row.phone,
  email: row.email,
  status: row.status,
  availability: row.availabilityNote || '',

  experience:
    row.experienceYears != null
      ? `${row.experienceYears} Years`
      : ''
});

const adaptReceptionist = (row) => ({
  id: row.code,
  dbId: row.id,
  code: row.code,
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

const convertTo24Hour = (timeStr) => {
  if (!timeStr) return '';
  if (!timeStr.includes(' ')) return timeStr;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (modifier === 'PM' && hours !== '12') {
    hours = parseInt(hours, 10) + 12;
  } else if (modifier === 'AM' && hours === '12') {
    hours = '00';
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const convertTo12Hour = (time24) => {
  if (!time24) return '';
  const [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
};

const adaptAppointment = (row) => ({
  id: row.code,
  dbId: row.id,

  patientId: row.patient?.code,
  patientName: row.patient?.name,

  doctorId: row.doctor?.code,
  doctorName: row.doctor?.name,

  date: row.date,

  time: row.time
    ? convertTo12Hour(row.time.slice(0, 5))
    : '',

  type: row.type,
  status: row.status,
  fee: row.fee
});

// adaptBed removed — bed management is now handled by the BedManagement module directly

const adaptBill = (row) => ({
  invoiceNo: row.invoiceNo,
  dbId: row.id,

  patientId: row.patient?.code,
  patientName: row.patient?.name,

  date: row.billDate,
  billType:
    row.billType === 'OPD'
      ? 'Consultation'
      : row.billType === 'Lab'
      ? 'Investigations'
      : row.billType,

  doctorName: row.doctor?.name || '',

  paymentMode: row.paymentMode,
  paymentStatus: row.paymentStatus,

  items: row.items
    ? row.items.map((item) => ({
        description: item.description,
        type: item.type,
        amount: item.amount
      }))
    : undefined,

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
  type: row.activityType || row.type
});

const LIST_ALL = {
  params: {
    limit: 100
  }
};

/* ============================================================================
   PROVIDER
============================================================================ */

export const HospitalProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  /* --------------------------------------------------------------------------
     BACKEND-PERSISTED STATE
  -------------------------------------------------------------------------- */

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  // beds state removed — bed management is self-contained in the BedManagement page
  const [bills, setBills] = useState([]);
  const [activities, setActivities] = useState([]);
  const [hospitalSettings, setHospitalSettings] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);

  /* --------------------------------------------------------------------------
     FRONTEND-ONLY CLINICAL STATE

     Current backend branch does not contain visit-history / EMR endpoints.

     Keep these workflows so the completed base frontend continues working.

     Later these functions should be migrated to PostgreSQL APIs.
  -------------------------------------------------------------------------- */

  const [toasts, setToasts] = useState([]);

  /* ==========================================================================
     TOAST HELPERS
  ========================================================================== */

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type
      }
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((toast) => toast.id !== id)
      );
    }, 4000);
  }, []);

  const reportError = useCallback(
    (error, fallbackMessage) => {
      const message =
        error.response?.data?.error?.message ||
        fallbackMessage;

      showToast(message, 'error');
    },
    [showToast]
  );

  /* ==========================================================================
     ACTIVITIES
  ========================================================================== */

  const fetchDashboardSummary = useCallback(async () => {
    try {
      const response = await apiClient.get('/dashboard/summary');
      setDashboardSummary(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard summary', error);
    }
  }, []);

  const refreshActivities = useCallback(async () => {
    try {
      const response = await apiClient.get('/activities', {
        params: {
          limit: 20
        }
      });

      setActivities(
        response.data.data.map(adaptActivity)
      );

      // Async fetch dashboard summary whenever activities are refreshed
      apiClient.get('/dashboard/summary').then((res) => {
        setDashboardSummary(res.data.data);
      }).catch((err) => {
        console.error('Failed to update dashboard summary', err);
      });
    } catch (error) {
      console.error(
        'Failed to load activity feed',
        error
      );
    }
  }, []);

  /* ==========================================================================
     INITIAL BACKEND DATA LOADING
  ========================================================================== */

  const fetchAll = useCallback(async () => {
    try {
      const [
        patientsResponse,
        doctorsResponse,
        receptionistsResponse,
        investigationsResponse,
        appointmentsResponse,

        billsResponse,
        hospitalSettingsResponse
      ] = await Promise.all([
        apiClient.get('/patients', LIST_ALL),
        apiClient.get('/doctors', LIST_ALL),
        apiClient.get('/receptionists', LIST_ALL),
        apiClient.get('/investigations', LIST_ALL),
        apiClient.get('/appointments', LIST_ALL),

        apiClient.get('/bills', LIST_ALL),
        apiClient.get('/hospital-settings')
      ]);

      setPatients(
        patientsResponse.data.data.map(adaptPatient)
      );

      setDoctors(
        doctorsResponse.data.data.map(adaptDoctor)
      );

      setReceptionists(
        receptionistsResponse.data.data.map(
          adaptReceptionist
        )
      );

      setInvestigations(
        investigationsResponse.data.data.map(
          adaptInvestigation
        )
      );

      setAppointments(
        appointmentsResponse.data.data.map(
          adaptAppointment
        )
      );

      setBills(
        billsResponse.data.data.map(adaptBill)
      );

      setHospitalSettings(
        hospitalSettingsResponse.data.data
      );

      await Promise.all([
        refreshActivities(),
        fetchDashboardSummary()
      ]);
    } catch (error) {
      reportError(
        error,
        'Failed to load hospital data. Please refresh.'
      );
    }
  }, [refreshActivities, fetchDashboardSummary, reportError]);

  useEffect(() => {
    let active = true;
    if (isAuthenticated) {
      Promise.resolve().then(() => {
        if (active) fetchAll().catch(() => {});
      });
    } else {
      Promise.resolve().then(() => {
        if (active) {
          setPatients([]);
          setDoctors([]);
          setReceptionists([]);
          setInvestigations([]);
          setAppointments([]);

          setBills([]);
          setActivities([]);
          setHospitalSettings(null);
          setDashboardSummary(null);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated, fetchAll]);

  /* ==========================================================================
     PATIENTS
  ========================================================================== */

  const addPatient = async (patient) => {
    try {
      const response = await apiClient.post('/patients', {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        address: patient.address,
        diagnosis: patient.diagnosis || patient.disease,
        lastVisitDate: new Date()
          .toISOString()
          .slice(0, 10)
      });

      const created = adaptPatient(
        response.data.data
      );

      setPatients((prev) => [
        created,
        ...prev
      ]);

      showToast(
        `Patient ${created.name} added successfully!`
      );

      refreshActivities();

      return created;
    } catch (error) {
      reportError(
        error,
        'Failed to add patient'
      );

      return undefined;
    }
  };

  const editPatient = async (
    code,
    updatedPatient
  ) => {
    const target = patients.find(
      (patient) => patient.id === code
    );

    if (!target) {
      return;
    }

    try {
      const response = await apiClient.put(
        `/patients/${target.dbId}`,
        {
          name: updatedPatient.name,
          age: updatedPatient.age,
          gender: updatedPatient.gender,
          phone: updatedPatient.phone,
          bloodGroup: updatedPatient.bloodGroup,
          address: updatedPatient.address,
          diagnosis: updatedPatient.diagnosis || updatedPatient.disease
        }
      );

      const saved = adaptPatient(
        response.data.data
      );

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === code
            ? saved
            : patient
        )
      );

      showToast(
        `Patient ${saved.name} updated successfully!`
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update patient'
      );
    }
  };

  const deletePatient = async (code) => {
    const target = patients.find(
      (patient) => patient.id === code
    );

    if (!target) {
      return;
    }

    try {
      await apiClient.delete(
        `/patients/${target.dbId}`
      );

      setPatients((prev) =>
        prev.filter(
          (patient) => patient.id !== code
        )
      );

      showToast(
        'Patient record deleted.',
        'warning'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to delete patient'
      );
    }
  };



  // const parseExperienceYears = (value) => {
  //   const match = String(value ?? '').match(/\d+/);

  //   return match
  //     ? parseInt(match[0], 10)
  //     : undefined;
  // };

  // const addDoctor = async (doctor) => {
  //   try {
  //     const response = await apiClient.post(
  //       '/doctors',
  //       {
  //         name: doctor.name,
  //         specialization: doctor.specialization,
  //         phone: doctor.phone,
  //         email: doctor.email,
  //         status: doctor.status || 'Active',
  //         availabilityNote:
  //           doctor.availability,
  //         experienceYears:
  //           parseExperienceYears(
  //             doctor.experience
  //           )
  //       }
  //     );

  //     const created = adaptDoctor(
  //       response.data.data
  //     );

  //     setDoctors((prev) => [
  //       ...prev,
  //       created
  //     ]);

  //     showToast(
  //       `Dr. ${created.name} added successfully!`
  //     );

  //     refreshActivities();

  //     return created;
  //   } catch (error) {
  //     reportError(
  //       error,
  //       'Failed to add doctor'
  //     );

  //     return undefined;
  //   }
  // };

  // const editDoctor = async (
  //   code,
  //   updatedDoctor
  // ) => {
  //   const target = doctors.find(
  //     (doctor) => doctor.id === code
  //   );

  //   if (!target) {
  //     return;
  //   }

  //   try {
  //     const response = await apiClient.put(
  //       `/doctors/${target.dbId}`,
  //       {
  //         name: updatedDoctor.name,
  //         specialization:
  //           updatedDoctor.specialization,
  //         phone: updatedDoctor.phone,
  //         email: updatedDoctor.email,
  //         status: updatedDoctor.status,
  //         availabilityNote:
  //           updatedDoctor.availability,
  //         experienceYears:
  //           parseExperienceYears(
  //             updatedDoctor.experience
  //           )
  //       }
  //     );

  //     const saved = adaptDoctor(
  //       response.data.data
  //     );

  //     setDoctors((prev) =>
  //       prev.map((doctor) =>
  //         doctor.id === code
  //           ? saved
  //           : doctor
  //       )
  //     );

  //     showToast(
  //       `Dr. ${saved.name} details updated!`
  //     );

  //     refreshActivities();
  //   } catch (error) {
  //     reportError(
  //       error,
  //       'Failed to update doctor'
  //     );
  //   }
  // };

  // const deleteDoctor = async (code) => {
  //   const target = doctors.find(
  //     (doctor) => doctor.id === code
  //   );

  //   if (!target) {
  //     return;
  //   }

  //   try {
  //     await apiClient.delete(
  //       `/doctors/${target.dbId}`
  //     );

  //     setDoctors((prev) =>
  //       prev.filter(
  //         (doctor) => doctor.id !== code
  //       )
  //     );

  //     showToast(
  //       'Doctor removed.',
  //       'warning'
  //     );

  //     refreshActivities();
  //   } catch (error) {
  //     reportError(
  //       error,
  //       'Failed to remove doctor'
  //     );
  //   }
  // };

  // const toggleDoctorStatus = async (code) => {
  //   const target = doctors.find(
  //     (doctor) => doctor.id === code
  //   );

  //   if (!target) {
  //     return;
  //   }

  //   try {
  //     const response = await apiClient.patch(
  //       `/doctors/${target.dbId}/status`
  //     );

  //     const saved = adaptDoctor(
  //       response.data.data
  //     );

  //     setDoctors((prev) =>
  //       prev.map((doctor) =>
  //         doctor.id === code
  //           ? saved
  //           : doctor
  //       )
  //     );

  //     showToast(
  //       `Dr. ${saved.name} is now ${saved.status}`
  //     );

  //     refreshActivities();
  //   } catch (error) {
  //     reportError(
  //       error,
  //       'Failed to update doctor status'
  //     );
  //   }
  // };

  /* ==========================================================================
   DOCTORS
========================================================================== */

const parseExperienceYears = (value) => {
  const match = String(value ?? '').match(/\d+/);

  return match
    ? parseInt(match[0], 10)
    : undefined;
};


/* --------------------------------------------------------------------------
   ADD DOCTOR
-------------------------------------------------------------------------- */

const addDoctor = async (doctor) => {
  try {
    const response = await apiClient.post('/doctors', {
      name: doctor.name.trim(),

      specialization: doctor.specialization.trim(),

      phone: doctor.phone.trim(),

      email: doctor.email?.trim() || undefined,

      status: doctor.status || 'Active',

      availabilityNote:
        doctor.availability?.trim() || undefined,

      experienceYears:
        parseExperienceYears(doctor.experience),

      password: doctor.password
    });


    const created = adaptDoctor(
      response.data.data
    );


    setDoctors((previous) => [
      ...previous,
      created
    ]);


    showToast(
      `${created.name} added successfully!`
    );


    await refreshActivities();


    return created;

  } catch (error) {

    console.error(
      'Failed to add doctor:',
      error
    );


    reportError(
      error,
      'Failed to add doctor'
    );


    return undefined;
  }
};


/* --------------------------------------------------------------------------
   EDIT DOCTOR
-------------------------------------------------------------------------- */

const editDoctor = async (
  code,
  updatedDoctor
) => {

  const target = doctors.find(
    (doctor) => doctor.id === code
  );


  if (!target) {

    showToast(
      'Doctor record not found.',
      'error'
    );

    return undefined;
  }


  try {

    const response = await apiClient.put(
      `/doctors/${target.dbId}`,
      {
        name:
          updatedDoctor.name.trim(),

        specialization:
          updatedDoctor.specialization.trim(),

        phone:
          updatedDoctor.phone.trim(),

        email:
          updatedDoctor.email?.trim() || undefined,

        status:
          updatedDoctor.status,

        availabilityNote:
          updatedDoctor.availability?.trim() || undefined,

        experienceYears:
          parseExperienceYears(
            updatedDoctor.experience
          ),
        password: updatedDoctor.password
      }
    );


    const saved = adaptDoctor(
      response.data.data
    );


    setDoctors((previous) =>
      previous.map((doctor) =>
        doctor.id === code
          ? saved
          : doctor
      )
    );


    showToast(
      `${saved.name} details updated successfully!`
    );


    await refreshActivities();


    return saved;

  } catch (error) {

    console.error(
      'Failed to update doctor:',
      error
    );


    reportError(
      error,
      'Failed to update doctor'
    );


    return undefined;
  }
};


/* --------------------------------------------------------------------------
   DELETE DOCTOR
-------------------------------------------------------------------------- */

const deleteDoctor = async (code) => {

  const target = doctors.find(
    (doctor) => doctor.id === code
  );


  if (!target) {

    showToast(
      'Doctor record not found.',
      'error'
    );

    return false;
  }


  try {

    await apiClient.delete(
      `/doctors/${target.dbId}`
    );


    setDoctors((previous) =>
      previous.filter(
        (doctor) =>
          doctor.id !== code
      )
    );


    showToast(
      `${target.name} removed successfully.`,
      'warning'
    );


    await refreshActivities();


    return true;

  } catch (error) {

    console.error(
      'Failed to delete doctor:',
      error
    );


    reportError(
      error,
      'Failed to remove doctor'
    );


    return false;
  }
};


/* --------------------------------------------------------------------------
   TOGGLE DOCTOR STATUS
-------------------------------------------------------------------------- */

const toggleDoctorStatus = async (code) => {

  const target = doctors.find(
    (doctor) => doctor.id === code
  );


  if (!target) {

    showToast(
      'Doctor record not found.',
      'error'
    );

    return undefined;
  }


  try {

    const response = await apiClient.patch(
      `/doctors/${target.dbId}/status`
    );


    const saved = adaptDoctor(
      response.data.data
    );


    setDoctors((previous) =>
      previous.map((doctor) =>
        doctor.id === code
          ? saved
          : doctor
      )
    );


    showToast(
      `${saved.name} is now ${saved.status}`
    );


    await refreshActivities();


    return saved;

  } catch (error) {

    console.error(
      'Failed to update doctor status:',
      error
    );


    reportError(
      error,
      'Failed to update doctor status'
    );


    return undefined;
  }
};

  /* ==========================================================================
     RECEPTIONISTS
  ========================================================================== */

  const addReceptionist = async (receptionist) => {
    try {
      const response = await apiClient.post(
        '/receptionists',
        {
          name: receptionist.name,
          phone: receptionist.phone,
          email: receptionist.email,
          shift: receptionist.shift,
          status:
            receptionist.status || 'Active',
          password: receptionist.password
        }
      );

      const created = adaptReceptionist(
        response.data.data
      );

      setReceptionists((prev) => [
        ...prev,
        created
      ]);

      showToast(
        `Receptionist ${created.name} registered!`
      );

      refreshActivities();

      return created;
    } catch (error) {
      reportError(
        error,
        'Failed to register receptionist'
      );

      return undefined;
    }
  };

  const editReceptionist = async (
    code,
    updatedReceptionist
  ) => {
    const target = receptionists.find(
      (receptionist) =>
        receptionist.id === code
    );

    if (!target) {
      return;
    }

    try {
      const response = await apiClient.put(
        `/receptionists/${target.dbId}`,
        {
          name: updatedReceptionist.name,
          phone: updatedReceptionist.phone,
          email: updatedReceptionist.email,
          shift: updatedReceptionist.shift,
          status: updatedReceptionist.status,
          password: updatedReceptionist.password
        }
      );

      const saved = adaptReceptionist(
        response.data.data
      );

      setReceptionists((prev) =>
        prev.map((receptionist) =>
          receptionist.id === code
            ? saved
            : receptionist
        )
      );

      showToast(
        'Receptionist details updated!'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update receptionist'
      );
    }
  };

  const deleteReceptionist = async (code) => {
    const target = receptionists.find(
      (receptionist) =>
        receptionist.id === code
    );

    if (!target) {
      return;
    }

    try {
      await apiClient.delete(
        `/receptionists/${target.dbId}`
      );

      setReceptionists((prev) =>
        prev.filter(
          (receptionist) =>
            receptionist.id !== code
        )
      );

      showToast(
        'Receptionist removed.',
        'warning'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to remove receptionist'
      );
    }
  };

  /* ==========================================================================
     INVESTIGATIONS
  ========================================================================== */

  const addInvestigation = async (
    investigation
  ) => {
    try {
      const response = await apiClient.post(
        '/investigations',
        {
          testName: investigation.testName,
          category: investigation.category,
          price: investigation.price
        }
      );

      const created = adaptInvestigation(
        response.data.data
      );

      setInvestigations((prev) => [
        ...prev,
        created
      ]);

      showToast(
        `Investigation ${created.testName} added to directory!`
      );

      refreshActivities();

      return created;
    } catch (error) {
      reportError(
        error,
        'Failed to add investigation'
      );

      return undefined;
    }
  };

  const editInvestigation = async (
    code,
    updatedInvestigation
  ) => {
    const target = investigations.find(
      (investigation) =>
        investigation.id === code
    );

    if (!target) {
      return;
    }

    try {
      const response = await apiClient.put(
        `/investigations/${target.dbId}`,
        {
          testName:
            updatedInvestigation.testName,
          category:
            updatedInvestigation.category,
          price:
            updatedInvestigation.price
        }
      );

      const saved = adaptInvestigation(
        response.data.data
      );

      setInvestigations((prev) =>
        prev.map((investigation) =>
          investigation.id === code
            ? saved
            : investigation
        )
      );

      showToast(
        'Lab test updated successfully!'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update investigation'
      );
    }
  };

  const deleteInvestigation = async (code) => {
    const target = investigations.find(
      (investigation) =>
        investigation.id === code
    );

    if (!target) {
      return;
    }

    try {
      await apiClient.delete(
        `/investigations/${target.dbId}`
      );

      setInvestigations((prev) =>
        prev.filter(
          (investigation) =>
            investigation.id !== code
        )
      );

      showToast(
        'Lab test deleted.',
        'warning'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to delete investigation'
      );
    }
  };

  /* ==========================================================================
     APPOINTMENTS
  ========================================================================== */

  const addAppointment = async (
    appointment
  ) => {
    const patient = patients.find(
      (item) =>
        item.id === appointment.patientId
    );

    const doctor = doctors.find(
      (item) =>
        item.id === appointment.doctorId
    );

    if (!patient || !doctor) {
      showToast(
        'Select a valid patient and doctor.',
        'error'
      );

      return undefined;
    }

    try {
      const response = await apiClient.post(
        '/appointments',
        {
          patientId: patient.dbId,
          doctorId: doctor.dbId,
          appointmentDate:
            appointment.date,
          appointmentTime:
            convertTo24Hour(appointment.time),
          type: appointment.type,
          fee: appointment.fee
        }
      );

      const created = adaptAppointment(
        response.data.data
      );

      setAppointments((prev) => [
        ...prev,
        created
      ]);

      showToast(
        'Appointment scheduled successfully!'
      );

      refreshActivities();

      return created;
    } catch (error) {
      reportError(
        error,
        'Failed to schedule appointment'
      );

      return undefined;
    }
  };

  const editAppointment = async (
    code,
    updatedAppointment
  ) => {
    const target = appointments.find(
      (appointment) =>
        appointment.id === code
    );

    const patient = patients.find(
      (item) =>
        item.id === updatedAppointment.patientId
    );

    const doctor = doctors.find(
      (item) =>
        item.id === updatedAppointment.doctorId
    );

    if (!target || !patient || !doctor) {
      return;
    }

    try {
      const response = await apiClient.put(
        `/appointments/${target.dbId}`,
        {
          patientId: patient.dbId,
          doctorId: doctor.dbId,
          appointmentDate:
            updatedAppointment.date,
          appointmentTime:
            convertTo24Hour(updatedAppointment.time),
          type: updatedAppointment.type,
          fee: updatedAppointment.fee
        }
      );

      const saved = adaptAppointment(
        response.data.data
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === code
            ? saved
            : appointment
        )
      );

      showToast(
        'Appointment details updated!'
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update appointment'
      );
    }
  };

  const updateAppointmentStatus = async (
    code,
    status
  ) => {
    const target = appointments.find(
      (appointment) =>
        appointment.id === code
    );

    if (!target) {
      return;
    }

    try {
      const response = await apiClient.patch(
        `/appointments/${target.dbId}/status`,
        {
          status
        }
      );

      const saved = adaptAppointment(
        response.data.data
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === code
            ? saved
            : appointment
        )
      );

      showToast(
        `Appointment status changed to ${status}`
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update appointment status'
      );
    }
  };

  const deleteAppointment = async (code) => {
    const target = appointments.find(
      (appointment) =>
        appointment.id === code
    );

    if (!target) {
      return;
    }

    try {
      await apiClient.delete(`/appointments/${target.dbId}`);
      setAppointments((prev) => prev.filter((a) => a.id !== code && a.dbId !== target.dbId));
      showToast('Appointment record permanently deleted.', 'warning');
      refreshActivities();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete appointment', 'error');
    }
  };

  // assignBed removed — use /api/bed-management/beds/:id/assign directly

  // transferBed removed — use /api/bed-management/beds/:id/vacate + assign directly


  /* ==========================================================================
     VISIT HISTORY / EMR HELPERS

     These are preserved from completed base frontend.

     Current backend branch has no endpoints for these workflows.
  ========================================================================== */

  const fetchVisitHistory = useCallback(async (patientCodeOrId, doctorCodeOrId) => {
    if (!patientCodeOrId) return [];
    const targetPatient = patients.find(p => p.id === patientCodeOrId || p.dbId === patientCodeOrId);
    const targetPatientId = targetPatient ? targetPatient.dbId : patientCodeOrId;

    const targetDoctor = doctorCodeOrId ? doctors.find(d => d.id === doctorCodeOrId || d.dbId === doctorCodeOrId) : null;
    const targetDoctorId = targetDoctor ? targetDoctor.dbId : (doctorCodeOrId || undefined);

    try {
      const response = await apiClient.get(`/consultations/patient/${targetPatientId}/history`, {
        params: { doctorId: targetDoctorId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to load EMR visit history:', error);
      return [];
    }
  }, [patients, doctors]);

  const addVitals = async (patientId, vitals) => {
    const targetPatient = patients.find(p => p.id === patientId || p.dbId === patientId);
    const targetPatientId = targetPatient ? targetPatient.dbId : patientId;

    const activeApt = appointments.find(
      a => (a.patientId === patientId || a.patientId === targetPatient?.code) && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    try {
      let bpSystolic, bpDiastolic;
      if (vitals.bp && vitals.bp.includes('/')) {
        const parts = vitals.bp.split('/');
        bpSystolic = parseInt(parts[0], 10) || undefined;
        bpDiastolic = parseInt(parts[1], 10) || undefined;
      }

      await apiClient.post('/consultations/vitals', {
        patientId: targetPatientId,
        appointmentId: activeApt ? activeApt.dbId : undefined,
        bpSystolic,
        bpDiastolic,
        bpText: vitals.bp || undefined,
        pulse: vitals.pulse ? parseInt(vitals.pulse, 10) : undefined,
        temperature: vitals.temp ? parseFloat(vitals.temp) : undefined,
        weight: vitals.weight ? parseFloat(vitals.weight) : undefined,
        height: vitals.height ? parseFloat(vitals.height) : undefined,
        spo2: vitals.spo2 ? parseInt(vitals.spo2, 10) : undefined,
        bloodSugar: vitals.sugar ? parseInt(vitals.sugar, 10) : undefined,
        bmi: vitals.bmi ? parseFloat(vitals.bmi) : undefined
      });

      showToast('Vitals recorded successfully!');
      await fetchAll();
    } catch (error) {
      reportError(error, 'Failed to record vitals');
    }
  };

  const orderInvestigation = async (patientId, test) => {
    const targetPatient = patients.find(p => p.id === patientId || p.dbId === patientId);

    const activeApt = appointments.find(
      a => (a.patientId === patientId || a.patientId === targetPatient?.code) && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    if (!activeApt) {
      showToast('No active appointment slot for this patient.', 'error');
      return;
    }

    try {
      const consRes = await apiClient.get(`/consultations/appointment/${activeApt.dbId}`);
      const consId = consRes.data.data.id;

      const inv = investigations.find(i => i.id === test.id || i.testName === test.testName);

      await apiClient.post('/consultations/investigations', {
        consultationId: consId,
        investigationId: inv ? inv.dbId : undefined,
        testName: test.testName
      });

      showToast('Investigation ordered successfully!');
      await fetchAll();
    } catch (error) {
      reportError(error, 'Failed to order investigation');
    }
  };

  const addPrescription = async (patientId, prescriptionList) => {
    const targetPatient = patients.find(p => p.id === patientId || p.dbId === patientId);

    const activeApt = appointments.find(
      a => (a.patientId === patientId || a.patientId === targetPatient?.code) && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    if (!activeApt) {
      showToast('No active appointment slot for this patient.', 'error');
      return;
    }

    try {
      const consRes = await apiClient.get(`/consultations/appointment/${activeApt.dbId}`);
      const consId = consRes.data.data.id;

      await apiClient.post('/consultations/prescriptions/batch', {
        consultationId: consId,
        prescriptions: prescriptionList.map(item => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.notes || item.instructions || ''
        }))
      });

      showToast('Prescription saved successfully!');
      await fetchAll();
    } catch (error) {
      reportError(error, 'Failed to save prescription');
    }
  };

  const addConsultationSummary = async (patientId, summary) => {
    const targetPatient = patients.find(p => p.id === patientId || p.dbId === patientId);

    const activeApt = appointments.find(
      a => (a.patientId === patientId || a.patientId === targetPatient?.code) && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    if (!activeApt) {
      showToast('No active appointment slot for this patient.', 'error');
      return;
    }

    try {
      const consRes = await apiClient.get(`/consultations/appointment/${activeApt.dbId}`);
      const consId = consRes.data.data.id;

      await apiClient.put(`/consultations/${consId}`, {
        symptoms: summary.symptoms,
        clinicalNotes: summary.findings,
        diagnosis: summary.diagnosis,
        treatmentPlan: summary.advice,
        followUpAdvice: summary.followUp
      });

      showToast('Consultation summary saved!');
      await fetchAll();
    } catch (error) {
      reportError(error, 'Failed to save consultation summary');
    }
  };

  const completeConsultation = async (patientId, summary = {}) => {
    const targetPatient = patients.find(p => p.id === patientId || p.dbId === patientId);

    const activeApt = appointments.find(
      a => (a.patientId === patientId || a.patientId === targetPatient?.code) && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    if (!activeApt) {
      showToast('No active appointment slot to complete.', 'error');
      return;
    }

    try {
      const consRes = await apiClient.get(`/consultations/appointment/${activeApt.dbId}`);
      const consId = consRes.data.data.id;

      await apiClient.post(`/consultations/${consId}/complete`, {
        symptoms: summary.symptoms,
        clinicalNotes: summary.findings,
        diagnosis: summary.diagnosis,
        treatmentPlan: summary.advice,
        followUpAdvice: summary.followUp
      });

      showToast(`Consultation marked completed!`);
      await fetchAll();
    } catch (error) {
      reportError(error, 'Failed to complete consultation');
    }
  };

  const addConsultationNotes = (patientId, notes, doctorName = 'Doctor') => {
    addConsultationSummary(patientId, {
      symptoms: 'Follow-up consultation notes recorded.',
      findings: 'Regular examination.',
      diagnosis: 'Osteoarthritis Knee',
      advice: notes,
      followUp: 'As advised'
    }, doctorName);
  };

  /* ==========================================================================
     BILLING
  ========================================================================== */

  const addBill = async (bill) => {
    const patient = patients.find(
      (item) =>
        item.id === bill.patientId
    );

    if (!patient) {
      showToast(
        'Select a valid patient.',
        'error'
      );

      return undefined;
    }

    const doctor = doctors.find(
      (item) =>
        item.id === bill.doctorId
    );

    try {
      const response = await apiClient.post(
        '/bills',
        {
          patientId: patient.dbId,
          doctorId: doctor?.dbId,
          billType:
            bill.billType === 'Consultation'
              ? 'OPD'
              : bill.billType === 'Investigations'
              ? 'Lab'
              : bill.billType,
          paymentMode: bill.paymentMode,
          paymentStatus: bill.paymentStatus,
          discount: bill.discount,
          tax: bill.tax,

          items: bill.items.map(
            (item) => ({
              description:
                item.description,

              itemType:
                item.type,

              amount:
                item.amount
            })
          )
        }
      );

      const created = adaptBill(
        response.data.data
      );

      setBills((prev) => [
        created,
        ...prev
      ]);

      showToast(
        `Invoice ${created.invoiceNo} generated!`
      );

      refreshActivities();

      return created;
    } catch (error) {
      reportError(
        error,
        'Failed to generate invoice'
      );

      return undefined;
    }
  };

  const getBillDetail = async (
    invoiceNo
  ) => {
    const target = bills.find(
      (bill) =>
        bill.invoiceNo === invoiceNo
    );

    if (!target) {
      return undefined;
    }

    try {
      const response = await apiClient.get(
        `/bills/${target.dbId}`
      );

      return adaptBill(
        response.data.data
      );
    } catch (error) {
      reportError(
        error,
        'Failed to load invoice details'
      );

      return undefined;
    }
  };

  const updateBillStatus = async (
    invoiceNo,
    status
  ) => {
    const target = bills.find(
      (bill) =>
        bill.invoiceNo === invoiceNo
    );

    if (!target) {
      return;
    }

    try {
      const response = await apiClient.patch(
        `/bills/${target.dbId}/status`,
        {
          paymentStatus: status
        }
      );

      const saved = adaptBill(
        response.data.data
      );

      setBills((prev) =>
        prev.map((bill) =>
          bill.invoiceNo === invoiceNo
            ? {
                ...saved,
                items: bill.items
              }
            : bill
        )
      );

      showToast(
        `Invoice ${invoiceNo} marked as ${status}`
      );

      refreshActivities();
    } catch (error) {
      reportError(
        error,
        'Failed to update invoice status'
      );
    }
  };

  /* ==========================================================================
     HOSPITAL SETTINGS
  ========================================================================== */

  const updateHospitalSettings = async (
    data
  ) => {
    try {
      const response = await apiClient.put(
        '/hospital-settings',
        data
      );

      setHospitalSettings(
        response.data.data
      );

      showToast(
        'Hospital organization details saved!'
      );

      refreshActivities();

      return response.data.data;
    } catch (error) {
      reportError(
        error,
        'Failed to save hospital details'
      );

      return undefined;
    }
  };

  /* ==========================================================================
     CONTEXT VALUE
  ========================================================================== */

  const value = {
    patients,
    doctors,
    receptionists,
    investigations,
    appointments,
    bills,
    activities,
    hospitalSettings,
    dashboardSummary,
    fetchDashboardSummary,

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

    addVitals,
    orderInvestigation,
    addPrescription,
    addConsultationSummary,
    addConsultationNotes,
    completeConsultation,
    fetchVisitHistory,

    addBill,
    getBillDetail,
    updateBillStatus,

    updateHospitalSettings
  };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useHospital = () => {
  const context = useContext(
    HospitalContext
  );

  if (!context) {
    throw new Error(
      'useHospital must be used within a HospitalProvider'
    );
  }

  return context;
};