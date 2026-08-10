import { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Eye, Edit, Trash2, Calendar, UserPlus, Search, UserCheck, Users } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';

const Patients = () => {
  const { patients, addPatient, editPatient, deletePatient } = useHospital();
  const { user } = useAuth();

  const [searchQuery,          setSearchQuery]          = useState('');
  const [patientModalOpen,     setPatientModalOpen]     = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [deleteConfirmOpen,    setDeleteConfirmOpen]    = useState(false);
  const [viewModalOpen,        setViewModalOpen]        = useState(false);
  const [selectedPatient,      setSelectedPatient]      = useState(null);
  const [selectedPatientId,    setSelectedPatientId]    = useState('');

  const handleSavePatient = async (data, bookAppointment = false) => {
    const p = await addPatient(data);
    if (p && bookAppointment) { setSelectedPatientId(p.id); setAppointmentModalOpen(true); }
    return p;
  };

  const handleEditPatient  = async (id, data) => await editPatient(id, data);

  const handleConfirmDelete = async () => {
    if (!selectedPatientId) return;
    const ok = await deletePatient(selectedPatientId);
    if (ok) { setDeleteConfirmOpen(false); setSelectedPatientId(''); }
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.code?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const columns = [
    {
      key: 'code', header: 'Patient ID', sortable: true,
      render: row => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 4 }}>
          {row.code}
        </span>
      )
    },
    {
      key: 'name', header: 'Patient Name', sortable: true,
      render: row => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#2278e8,#26a1ae)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
            {row.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</span>
        </div>
      )
    },
    {
      key: 'age', header: 'Age / Gender',
      render: row => <span style={{ fontWeight: 600, color: '#111827' }}>{row.age} yrs &middot; {row.gender}</span>
    },
    { key: 'phone', header: 'Phone' },
    {
      key: 'bloodGroup', header: 'Blood Group',
      render: row => (
        <span style={{ display: 'inline-block', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 5, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#be123c' }}>
          {row.bloodGroup || 'O+'}
        </span>
      )
    },
    {
      key: 'lastVisitDate', header: 'Last Visit', sortable: true,
      render: row => <span style={{ fontWeight: 500, color: '#374151' }}>{row.lastVisitDate || '—'}</span>
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ─── Page Header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>Patients</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setSelectedPatient(null); setPatientModalOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            borderRadius: 8, border: 'none', background: '#2278e8',
            fontSize: '0.8125rem', fontWeight: 600, color: '#fff', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(34,120,232,0.3)',
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Add Patient
        </button>
      </div>

      {/* ─── Search + Table ───────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Search row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search style={{ position: 'absolute', left: 10, width: 14, height: 14, color: '#6b7280', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or ID…"
              style={{
                paddingLeft: 32, paddingRight: 12, height: 34, width: 280,
                borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
                fontSize: '0.8125rem', color: '#0f172a', fontWeight: 400, outline: 'none', transition: 'all 120ms',
              }}
              onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#3898f3'; e.target.style.boxShadow = '0 0 0 3px rgba(56,152,243,0.10)'; }}
              onBlur={e  => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>
            <Users style={{ width: 13, height: 13 }} />
            {filteredPatients.length} result{filteredPatients.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Empty search state */}
        {filteredPatients.length === 0 && searchQuery.trim() ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1.5px dashed #e5e7eb', borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <UserPlus style={{ width: 20, height: 20, color: '#2278e8' }} />
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Patient not found</p>
            <p style={{ fontSize: '0.75rem', color: '#374151', marginBottom: 16 }}>
              "{searchQuery}" doesn't match any registered patients.
            </p>
            <button
              type="button"
              onClick={() => setPatientModalOpen(true)}
              style={{ height: 34, padding: '0 16px', borderRadius: 8, background: '#2278e8', border: 'none', color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Register Patient
            </button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredPatients}
            emptyMessage="No patient records yet"
            itemsPerPage={8}
            actions={row => (
              <ThreeDotMenu
                options={[
                  { label: 'View Profile',      icon: Eye,      onClick: () => { setSelectedPatient(row); setViewModalOpen(true); } },
                  { label: 'Edit Details',      icon: Edit,     onClick: () => { setSelectedPatient(row); setPatientModalOpen(true); } },
                  { label: 'Book Appointment',  icon: Calendar, onClick: () => { setSelectedPatientId(row.id); setAppointmentModalOpen(true); } },
                  ...(user?.role === 'Admin' ? [{ label: 'Delete', icon: Trash2, destructive: true, onClick: () => { setSelectedPatientId(row.id); setDeleteConfirmOpen(true); } }] : [])
                ]}
              />
            )}
          />
        )}
      </div>

      {/* ─── View Demographics Modal ─────────────────── */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Patient Demographics" size="sm">
        {selectedPatient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: '1rem', borderBottom: '1px solid #f1f3f4' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#2278e8,#26a1ae)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                {selectedPatient.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{selectedPatient.name}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>ID: {selectedPatient.code}</p>
              </div>
            </div>

            {/* Fields grid */}
            {[
              ['Age & Gender', `${selectedPatient.age} yrs / ${selectedPatient.gender}`],
              ['Blood Group', selectedPatient.bloodGroup || 'O+'],
              ['Phone Number', selectedPatient.phone],
              ['Diagnosis', selectedPatient.diagnosis || 'General checkup'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{value}</p>
              </div>
            ))}

            {/* Address */}
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Address</p>
              <div style={{ background: '#f8f9fa', border: '1px solid #e8eaed', borderRadius: 8, padding: '10px 12px', fontSize: '0.8125rem', fontWeight: 500, color: '#0f172a', lineHeight: 1.5 }}>
                {selectedPatient.address || 'Danavaipeta, Rajahmundry'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modals ──────────────────────────────────── */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={selectedPatient ? data => handleEditPatient(selectedPatient.id, data) : handleSavePatient}
        patient={selectedPatient}
      />
      <AppointmentModal isOpen={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} initialPatientId={selectedPatientId} />
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Patient Record"
        message="Permanently delete this patient file? All history and appointments will be lost."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Patients;
