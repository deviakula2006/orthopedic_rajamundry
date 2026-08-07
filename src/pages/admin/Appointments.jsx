import { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, UserPlus, ShieldAlert, HeartPulse, Activity, Search } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import StatusBadge from '../../components/common/StatusBadge';
import Autocomplete from '../../components/common/Autocomplete';

// Modals
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';
import AddVitalsModal from '../../components/modals/AddVitalsModal';
import OrderInvestigationModal from '../../components/modals/OrderInvestigationModal';

const FILTER_TABS = [
  { id: 'Today', label: "Today's Appointments" },
  { id: 'Tomorrow', label: 'Tomorrow' },
  { id: 'Upcoming', label: 'Upcoming' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
  { id: 'All', label: 'All Records' }
];

const Appointments = () => {
  const {
    appointments,
    patients,
    addPatient,
    updateAppointmentStatus,
    deleteAppointment
  } = useHospital();

  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('Today');
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

  // Today & Tomorrow ISO date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Save new patient and trigger appointment modal
  const handleSavePatient = (patientData) => {
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

  // Filter & Sort Appointments
  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    // 1. Status / Date Filter Tab
    if (filterTab === 'Today') {
      result = result.filter((a) => a.date === todayStr && a.status !== 'Completed' && a.status !== 'Cancelled');
    } else if (filterTab === 'Tomorrow') {
      result = result.filter((a) => a.date === tomorrowStr);
    } else if (filterTab === 'Upcoming') {
      result = result.filter((a) => a.date >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled');
    } else if (filterTab === 'Completed') {
      result = result.filter((a) => a.status === 'Completed');
    } else if (filterTab === 'Cancelled') {
      result = result.filter((a) => a.status === 'Cancelled');
    }

    // 2. Table Search Query
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          (a.patientName && a.patientName.toLowerCase().includes(q)) ||
          (a.patientId && a.patientId.toLowerCase().includes(q)) ||
          (a.doctorName && a.doctorName.toLowerCase().includes(q)) ||
          (a.id && a.id.toLowerCase().includes(q)) ||
          (a.patientPhone && a.patientPhone.includes(q))
      );
    }

    // 3. Sort by Date -> Time
    return result.sort((a, b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [appointments, filterTab, tableSearchQuery, todayStr, tomorrowStr]);

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
      {/* Roster Search / Add Patient block */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Search Registered Patient to Book Appointment
        </span>
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          <div className="flex-1 w-full">
            <Autocomplete
              options={patients}
              value={selectedPatientId}
              onChange={(val) => {
                setSelectedPatientId(val);
                if (val) {
                  setAppointmentModalOpen(true);
                }
              }}
              placeholder="Search patient by name or ID to book..."
              displayKey="name"
              idKey="id"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setPatientModalOpen(true)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 py-2.5 px-4 text-xs font-bold text-hospital-600 transition-colors cursor-pointer"
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
              className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-5 py-2.5 text-xs font-bold text-white shadow-premium hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Appointment Table Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-hospital-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dedicated Table Search */}
          <div className="relative min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              placeholder="Search table by name, ID, doctor..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Main Table */}
        <Table
          columns={columns}
          data={filteredAppointments}
          emptyMessage={`No appointments found under "${filterTab}" filter.`}
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
      </div>

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
        message="Are you sure you want to permanently delete this appointment record from the database?"
        confirmText="Delete Permanently"
        type="danger"
      />

      {/* Confirm Cancellation */}
      <ConfirmationModal
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Patient Appointment"
        message="Are you sure you want to cancel this scheduled checkup? The time slot will be immediately vacated."
        confirmText="Cancel Checkup"
        type="warning"
      />
    </div>
  );
};

export default Appointments;
