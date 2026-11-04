import { Modal } from '../ui/Modal';

const PatientDetailsModal = ({ isOpen, onClose, patient }) => {
  if (!isOpen || !patient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Patient Demographics" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: '1rem', borderBottom: '1px solid #f1f3f4' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#2278e8,#26a1ae)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {patient.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{patient.name}</p>
            <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
              ID: {patient.code || patient.id}
            </p>
          </div>
        </div>

        {/* Fields grid */}
        {[
          ['Age & Gender', `${patient.age ?? '—'} yrs / ${patient.gender ?? '—'}`],
          ['Blood Group', patient.bloodGroup || 'O+'],
          ['Phone Number', patient.phone || '—'],
          ['Assigned Doctor', patient.assignedDoctor || patient.doctorName || 'Not Assigned'],
          ['Diagnosis', patient.diagnosis || patient.disease || 'General checkup'],
          ...(patient.registeredDate || patient.lastVisit || patient.createdAt
            ? [['Registration Date', String(patient.registeredDate || patient.lastVisit || patient.createdAt).slice(0, 10)]]
            : [])
        ].map(([label, value]) => (
          <div key={label}>
            <p
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: label === 'Assigned Doctor' && value !== 'Not Assigned' ? '#1d4ed8' : '#0f172a'
              }}
            >
              {value}
            </p>
          </div>
        ))}

        {/* Address */}
        <div>
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6
            }}
          >
            Address
          </p>
          <div
            style={{
              background: '#f8f9fa',
              border: '1px solid #e8eaed',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: '#0f172a',
              lineHeight: 1.5
            }}
          >
            {patient.address || 'Danavaipeta, Rajahmundry'}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PatientDetailsModal;

