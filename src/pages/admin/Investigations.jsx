import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2, FlaskConical } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import InvestigationModal from '../../components/modals/InvestigationModal';

const Investigations = () => {
  const { investigations, deleteInvestigation } = useHospital();

  const [isModalOpen,       setIsModalOpen]       = useState(false);
  const [selectedInv,       setSelectedInv]       = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTestId,    setSelectedTestId]    = useState('');

  const handleOpenAdd  = ()    => { setSelectedInv(null); setIsModalOpen(true); };
  const handleOpenEdit = (inv) => { setSelectedInv(inv);  setIsModalOpen(true); };
  const triggerDelete  = (id)  => { setSelectedTestId(id); setDeleteConfirmOpen(true); };

  const handleConfirmDelete = () => {
    if (selectedTestId) { deleteInvestigation(selectedTestId); setSelectedTestId(''); }
  };

  const columns = [
    {
      key: 'id', header: 'Test Code', sortable: true,
      render: row => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 4 }}>
          {row.id}
        </span>
      )
    },
    {
      key: 'testName', header: 'Investigation / Test Name', sortable: true,
      render: row => <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.testName}</span>
    },
    {
      key: 'price', header: 'Price (INR)', sortable: true,
      render: row => <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{row.price}</span>
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ─── Page Header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>
            Investigations
          </h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
            {investigations.length} test profile{investigations.length !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px',
            borderRadius: 8, border: 'none', background: '#2278e8',
            fontSize: '0.8125rem', fontWeight: 600, color: '#fff', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(34,120,232,0.3)',
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Add Test Profile
        </button>
      </div>

      {/* ─── Table ───────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <Table
          columns={columns}
          data={investigations}
          searchKey="testName"
          emptyMessage="No test profiles found"
          itemsPerPage={10}
          actions={row => (
            <ThreeDotMenu
              options={[
                { label: 'Edit Rates', icon: Edit, onClick: () => handleOpenEdit(row) },
                { label: 'Delete',     icon: Trash2, destructive: true, onClick: () => triggerDelete(row.id) },
              ]}
            />
          )}
        />
      </div>

      <InvestigationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} investigation={selectedInv} />

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Test Profile"
        message="Delete this investigation from the master catalog? Active bills will retain their values."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Investigations;
