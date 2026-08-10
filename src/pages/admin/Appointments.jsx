import { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, UserPlus, ShieldAlert, HeartPulse, Activity, Search, Calendar } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import StatusBadge from '../../components/common/StatusBadge';
import Autocomplete from '../../components/common/Autocomplete';

import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';
import AddVitalsModal from '../../components/modals/AddVitalsModal';
import OrderInvestigationModal from '../../components/modals/OrderInvestigationModal';

const FILTER_TABS = [
  { id: 'Today',     label: "Today"     },
  { id: 'Tomorrow',  label: 'Tomorrow'  },
  { id: 'Upcoming',  label: 'Upcoming'  },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
  { id: 'All',       label: 'All'       },
];

const Appointments = () => {
  const { appointments, patients, addPatient, updateAppointmentStatus, deleteAppointment } = useHospital();

  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('Today');
  const [selectedApt, setSelectedApt] = useState(null);

  const [patientModalOpen,     setPatientModalOpen]     = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [vitalsOpen,           setVitalsOpen]           = useState(false);
  const [orderOpen,            setOrderOpen]            = useState(false);
  const [deleteConfirmOpen,    setDeleteConfirmOpen]    = useState(false);
  const [cancelConfirmOpen,    setCancelConfirmOpen]    = useState(false);
  const [selectedPatientId,    setSelectedPatientId]    = useState('');
  const [selectedAptId,        setSelectedAptId]        = useState('');

  const todayStr    = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
  }, []);

  const handleSavePatient = (data) => {
    const p = addPatient(data);
    if (p) { setSelectedPatientId(p.id); setAppointmentModalOpen(true); }
  };

  const handleConfirmDelete = () => {
    if (selectedAptId) { deleteAppointment(selectedAptId); setSelectedAptId(''); }
  };

  const handleConfirmCancel = () => {
    if (selectedAptId) { updateAppointmentStatus(selectedAptId, 'Cancelled'); setSelectedAptId(''); }
  };

  const filteredAppointments = useMemo(() => {
    let r = [...appointments];
    if (filterTab === 'Today')     r = r.filter(a => a.date === todayStr && a.status !== 'Completed' && a.status !== 'Cancelled');
    else if (filterTab === 'Tomorrow')  r = r.filter(a => a.date === tomorrowStr);
    else if (filterTab === 'Upcoming')  r = r.filter(a => a.date >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled');
    else if (filterTab === 'Completed') r = r.filter(a => a.status === 'Completed');
    else if (filterTab === 'Cancelled') r = r.filter(a => a.status === 'Cancelled');

    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase();
      r = r.filter(a =>
        (a.patientName  && a.patientName.toLowerCase().includes(q)) ||
        (a.patientId    && a.patientId.toLowerCase().includes(q))   ||
        (a.doctorName   && a.doctorName.toLowerCase().includes(q))  ||
        (a.id           && a.id.toLowerCase().includes(q))          ||
        (a.patientPhone && a.patientPhone.includes(q))
      );
    }

    return r.sort((a, b) => {
      if (a.date !== b.date) return (a.date||'').localeCompare(b.date||'');
      return (a.time||'').localeCompare(b.time||'');
    });
  }, [appointments, filterTab, tableSearchQuery, todayStr, tomorrowStr]);

  const columns = [
    {
      key: 'id', header: 'APT ID', sortable: true,
      render: row => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#374151', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
          {row.id}
        </span>
      )
    },
    {
      key: 'patientName', header: 'Patient', sortable: true,
      render: row => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{row.patientName}</div>
          <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.7rem', marginTop: 1 }}>{row.patientId}</div>
        </div>
      )
    },
    {
      key: 'doctorName', header: 'Consultant', sortable: true,
      render: row => <span style={{ fontWeight: 600, color: '#111827' }}>{row.doctorName}</span>
    },
    {
      key: 'date', header: 'Date & Time', sortable: true,
      render: row => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{row.date}</div>
          <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.7rem', marginTop: 1 }}>{row.time}</div>
        </div>
      )
    },
    {
      key: 'type', header: 'Type',
      render: row => (
        <span style={{ display: 'inline-block', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, color: '#334155' }}>
          {row.type}
        </span>
      )
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: row => <StatusBadge status={row.status} />
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ─── Page Header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>
            Appointment Scheduler
          </h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
            Book, manage and track patient appointments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setPatientModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#ffffff',
              fontSize: '0.8125rem', fontWeight: 600, color: '#111827',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <UserPlus style={{ width: 14, height: 14 }} />
            New Patient
          </button>
          <button
            type="button"
            onClick={() => { setSelectedApt(null); setSelectedPatientId(''); setAppointmentModalOpen(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 14px', borderRadius: 8,
              border: 'none', background: '#2278e8',
              fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(34,120,232,0.3)',
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            Book Appointment
          </button>
        </div>
      </div>

      {/* ─── Patient Search + Book ───────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
          Search patient to book appointment
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Autocomplete
              options={patients}
              value={selectedPatientId}
              onChange={(val) => {
                setSelectedPatientId(val);
                if (val) setAppointmentModalOpen(true);
              }}
              placeholder="Search by patient name or ID…"
              displayKey="name"
              idKey="id"
            />
          </div>
        </div>
      </div>

      {/* ─── Tabs + Search + Table ───────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Top toolbar */}
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 12, padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '5px 12px', borderRadius: 7,
                  fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 120ms',
                  background: filterTab === tab.id ? '#2278e8' : '#f3f4f6',
                  color:      filterTab === tab.id ? '#ffffff' : '#1f2937',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search style={{ position: 'absolute', left: 10, width: 14, height: 14, color: '#6b7280', pointerEvents: 'none' }} />
            <input
              type="text"
              value={tableSearchQuery}
              onChange={e => setTableSearchQuery(e.target.value)}
              placeholder="Search by name, ID, doctor…"
              style={{
                paddingLeft: 32, paddingRight: 12, height: 34, width: 240,
                borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
                fontSize: '0.8125rem', color: '#0f172a', fontWeight: 400,
                outline: 'none', transition: 'all 120ms',
              }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3898f3'; e.target.style.boxShadow = '0 0 0 3px rgba(56,152,243,0.10)'; }}
              onBlur={e  => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Count row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar style={{ width: 13, height: 13, color: '#374151' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#374151' }}>
            · {filterTab === 'Today' ? 'today' : filterTab.toLowerCase()}
          </span>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={filteredAppointments}
          emptyMessage={`No ${filterTab.toLowerCase()} appointments`}
          itemsPerPage={8}
          actions={row => (
            <ThreeDotMenu
              options={[
                { label: 'Reschedule / Edit', icon: Edit,       onClick: () => { setSelectedApt(row); setAppointmentModalOpen(true); } },
                { label: 'Add Vitals',        icon: HeartPulse, onClick: () => { setSelectedPatientId(row.patientId); setVitalsOpen(true); } },
                { label: 'Add Investigation', icon: Activity,   onClick: () => { setSelectedPatientId(row.patientId); setOrderOpen(true); } },
                { label: 'Cancel',            icon: ShieldAlert, destructive: true, onClick: () => { setSelectedAptId(row.id); setCancelConfirmOpen(true); } },
                { label: 'Delete',            icon: Trash2,     destructive: true, onClick: () => { setSelectedAptId(row.id); setDeleteConfirmOpen(true); } },
              ]}
            />
          )}
        />
      </div>

      {/* ─── Modals ──────────────────────────────────── */}
      <PatientModal     isOpen={patientModalOpen}     onClose={() => setPatientModalOpen(false)}     onSave={handleSavePatient} />
      <AppointmentModal isOpen={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} appointment={selectedApt}  initialPatientId={selectedPatientId} />
      <AddVitalsModal   isOpen={vitalsOpen}           onClose={() => setVitalsOpen(false)}           patientId={selectedPatientId} />
      <OrderInvestigationModal isOpen={orderOpen}     onClose={() => setOrderOpen(false)}            patientId={selectedPatientId} />

      <ConfirmationModal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete} title="Delete Appointment"
        message="Permanently delete this appointment record?" confirmText="Delete" type="danger" />

      <ConfirmationModal isOpen={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel} title="Cancel Appointment"
        message="Cancel this scheduled appointment? The slot will be freed immediately." confirmText="Cancel Appointment" type="warning" />
    </div>
  );
};

export default Appointments;
