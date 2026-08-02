import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Modals
import InvestigationModal from '../../components/modals/InvestigationModal';

const Investigations = () => {
  const { investigations, deleteInvestigation } = useHospital();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
  
  // Confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');

  const handleOpenAdd = () => {
    setSelectedInv(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv) => {
    setSelectedInv(inv);
    setIsModalOpen(true);
  };

  const triggerDelete = (id) => {
    setSelectedTestId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTestId) {
      deleteInvestigation(selectedTestId);
      setSelectedTestId('');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Test Code',
      sortable: true,
      render: (row) => <span className="font-bold text-hospital-600">{row.id}</span>
    },
    {
      key: 'testName',
      header: 'Investigation / Test Name',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{row.testName}</span>
    },
    {
      key: 'price',
      header: 'Price (INR)',
      sortable: true,
      render: (row) => <span className="font-extrabold text-slate-700">₹{row.price}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
<div className="flex flex-col sm:flex-row justify-end">        
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Test Profile</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={investigations}
        searchPlaceholder="Search tests by name..."
        searchKey="testName"
        emptyMessage="No laboratory tests found matching parameters"
        itemsPerPage={6}
        actions={(row) => (
          <ThreeDotMenu
            options={[
              {
                label: 'Edit Rates',
                icon: Edit,
                onClick: () => handleOpenEdit(row)
              },
              {
                label: 'Delete Test',
                icon: Trash2,
                destructive: true,
                onClick: () => triggerDelete(row.id)
              }
            ]}
          />
        )}
      />

      {/* Global Add/Edit Modal */}
      <InvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        investigation={selectedInv}
      />

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Test Profile"
        message="Are you sure you want to delete this diagnostics investigation test profile from the master catalog? Active bills referencing it will retain their values, but it will be removed from future selection options."
        confirmText="Delete Test"
        type="danger"
      />
    </div>
  );
};

export default Investigations;
