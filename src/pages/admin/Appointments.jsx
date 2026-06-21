import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Plus, Eye, Edit, Trash2, Calendar, UserPlus, Search, ShieldAlert, HeartPulse, Activity } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import StatusBadge from '../../components/common/StatusBadge';
import Autocomplete from '../../components/common/Autocomplete';

// Modals
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';
import AddVitalsModal from '../../components/modals/AddVitalsModal';
import OrderInvestigationModal from '../../components/modals/OrderInvestigationModal';

const Appointments = () => {
  const {
    appointments,
    patients,
    addPatient,
    updateAppointmentStatus,
    deleteAppointment
  } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApt, setSelectedApt] = useState(null);
  
  // Modal states
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  
  // Confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAptId, setSelectedAptId] = useState('');

  // Save new patient and trigger appointment modal
  const handleSavePatient = (patientData, bookAppointment = false) => {
    const newPatient = addPatient(patientData);
    if (newPatient) {
      setSelectedPatientId(newPatient.id);
      setAppointmentModalOpen(true);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedAptId) {
      deleteAppointment(selectedAptId);
      setSelectedAptId('');
    }
  };

  const handleConfirmCancel = () => {
    if (selectedAptId) {
      updateAppointmentStatus(selectedAptId, 'Cancelled');
      setSelectedAptId('');
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    return appointments.filter(
      (a) =>
        a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [appointments, searchQuery]);

  const columns = [
    {
      key: 'id',
      header: 'Apt ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-500">{row.id}</span>
    },
    {
      key: 'patientName',
      header: 'Patient Details',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">{row.patientName}</span>
          <span className="text-[10px] font-semibold text-slate-400 block">{row.patientId}</span>
        </div>
      )
    },
    {
      key: 'doctorName',
      header: 'Assigned Consultant',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-700">{row.doctorName}</span>
      )
    },
    {
      key: 'date',
      header: 'Date & Time',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">{row.date}</span>
          <span className="text-xs text-slate-400 font-semibold block">{row.time}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Checkup Type',
      render: (row) => (
        <span className="inline-block rounded bg-slate-50 border px-2 py-0.5 text-xs font-bold text-slate-600">
          {row.type}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Schedule Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Roster Search / Add Patient block */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Search Registered Patient to Book Appointment
        </span>
        <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
  <div className="flex-1">
    <Autocomplete
      options={patients}
      value={selectedPatientId}
      onChange={(val) => {
        setSelectedPatientId(val);
        if (val) {
          setAppointmentModalOpen(true);
        }
      }}
      placeholder="Search patients by name or ID..."
      displayKey="name"
      idKey="id"
    />
  </div>

  <button
    type="button"
    onClick={() => setPatientModalOpen(true)}
    className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 py-2.5 px-4 text-xs font-bold text-hospital-600"
  >
    <UserPlus className="h-4 w-4" />
    <span>Add Patient & Book</span>
  </button>

  <button
    type="button"
    onClick={() => {
      setSelectedApt(null);
      setSelectedPatientId('');
      setAppointmentModalOpen(true);
    }}
    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium"
  >
    <Plus className="h-4 w-4" />
    <span>Book Appointment</span>
  </button>
</div>
        </div>

      {/* Search in active appointments Table */}
      

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredAppointments}
        emptyMessage="No matching appointments found"
        itemsPerPage={6}
        actions={(row) => (
          <ThreeDotMenu
            options={[
              {
                label: 'Reschedule / Edit',
                icon: Edit,
                onClick: () => {
                  setSelectedApt(row);
                  setAppointmentModalOpen(true);
                }
              },
              {
                label: 'Add Vitals',
                icon: HeartPulse,
                onClick: () => {
                  setSelectedPatientId(row.patientId);
                  setVitalsOpen(true);
                }
              },
              {
                label: 'Add Investigation',
                icon: Activity,
                onClick: () => {
                  setSelectedPatientId(row.patientId);
                  setOrderOpen(true);
                }
              },
              {
                label: 'Cancel Appointment',
                icon: ShieldAlert,
                destructive: true,
                onClick: () => {
                  setSelectedAptId(row.id);
                  setCancelConfirmOpen(true);
                }
              },
              {
                label: 'Delete Record',
                icon: Trash2,
                destructive: true,
                onClick: () => {
                  setSelectedAptId(row.id);
                  setDeleteConfirmOpen(true);
                }
              }
            ]}
          />
        )}
      />

      {/* Patient modal */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSavePatient}
      />

      {/* Appointment scheduling modal */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        appointment={selectedApt}
        initialPatientId={selectedPatientId}
      />

      {/* Vitals Form modal */}
      <AddVitalsModal
        isOpen={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        patientId={selectedPatientId}
      />

      {/* Order investigation modal */}
      <OrderInvestigationModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        patientId={selectedPatientId}
      />

      {/* Confirm Deletion */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment Record"
        message="Are you sure you want to delete this appointment from history?"
        confirmText="Delete"
        type="danger"
      />

      {/* Confirm Cancellation */}
      <ConfirmationModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Patient Appointment"
        message="Are you sure you want to cancel this scheduled checkup? The slot will be vacated."
        confirmText="Cancel Checkup"
        type="warning"
      />
    </div>
  );
};

export default Appointments;
