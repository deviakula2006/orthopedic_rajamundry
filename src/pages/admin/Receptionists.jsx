import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit, Trash2, Clock, Eye } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const Receptionists = () => {
  const {
    receptionists,
    addReceptionist,
    editReceptionist,
    deleteReceptionist
  } = useHospital();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);

  // Confirmation Modals State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState('');
  const [recToToggle, setRecToToggle] = useState(null);

  // View modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewRec, setViewRec] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    shift: 'Morning (8 AM - 4 PM)',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      shift: 'Morning (8 AM - 4 PM)',
      status: 'Active',
      password: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setSelectedRec(rec);
    setFormData({
      name: rec.name,
      phone: rec.phone,
      email: rec.email,
      shift: rec.shift,
      status: rec.status,
      password: ''
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (rec) => {
    setViewRec(rec);
    setIsViewOpen(true);
  };

 const handleAddSubmit = async (e) => {
  e.preventDefault();

  const createdReceptionist = await addReceptionist(formData);

  if (createdReceptionist) {
    setIsAddOpen(false);
  }
};

const handleEditSubmit = async (e) => {
  e.preventDefault();

  if (!selectedRec) {
    return;
  }

  const updatedReceptionist = await editReceptionist(
    selectedRec.id,
    formData
  );

  if (updatedReceptionist) {
    setIsEditOpen(false);
    setSelectedRec(null);
  }
};

const triggerStatusToggle = (rec) => {
  setRecToToggle(rec);
  setStatusConfirmOpen(true);
};

const handleConfirmStatusToggle = async () => {
  if (!recToToggle) {
    return;
  }

  const newStatus =
    recToToggle.status === 'Active' ? 'Inactive' : 'Active';

  const updatedReceptionist = await editReceptionist(
    recToToggle.id,
    {
      name: recToToggle.name,
      phone: recToToggle.phone,
      email: recToToggle.email,
      shift: recToToggle.shift,
      status: newStatus
    }
  );

  if (updatedReceptionist) {
    setStatusConfirmOpen(false);
    setRecToToggle(null);
  }
};

const triggerDelete = (id) => {
  setSelectedRecId(id);
  setDeleteConfirmOpen(true);
};

const handleConfirmDelete = async () => {
  if (!selectedRecId) {
    return;
  }

  const deleted = await deleteReceptionist(selectedRecId);

  if (deleted) {
    setDeleteConfirmOpen(false);
    setSelectedRecId('');
  }
};

  const columns = [
    {
      key: 'id', header: 'Staff ID', sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc', padding: '2px 8px', borderRadius: 4 }}>
          {row.id}
        </span>
      )
    },
    {
      key: 'name', header: 'Receptionist Name', sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#0e7490,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
            {row.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{row.name}</div>
            <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.7rem', marginTop: 1 }}>{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone Number'
    },
    {
      key: 'shift', header: 'Duty Shift',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock style={{ width: 12, height: 12, color: '#374151', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{row.shift}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Access Status',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => triggerStatusToggle(row)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all border cursor-pointer ${
            row.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          }`}
          title="Click to toggle status"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          ></span>
          {row.status}
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>Receptionists</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
            {receptionists.length} staff member{receptionists.length !== 1 ? 's' : ''} on roster
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#2278e8', fontSize: '0.8125rem', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(34,120,232,0.3)' }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Add Receptionist
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
      <Table
        columns={columns}
        data={receptionists}
          itemsPerPage={8}
          actions={(row) => (
            <ThreeDotMenu
              options={[
                { label: 'View Details', icon: Eye,   onClick: () => handleOpenView(row) },
                { label: 'Edit Details', icon: Edit,  onClick: () => handleOpenEdit(row) },
                { label: 'Remove',       icon: Trash2, destructive: true, onClick: () => triggerDelete(row.id) },
              ]}
            />
          )}
        />
      </div>

      {/* Modal: Add Receptionist */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Roster Staff" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Staff Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Kishore Kumar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Duty Shift
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all cursor-pointer font-semibold"
              >
                <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                <option value="Evening (4 PM - 12 AM)">Evening (4 PM - 12 AM)</option>
                <option value="Night (12 AM - 8 AM)">Night (12 AM - 8 AM)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543219"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. kishore.k@roh.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Login Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 8 characters"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-hospital-500 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 cursor-pointer"
            >
              Add Staff
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Receptionist */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Staff Access" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Staff Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Duty Shift
              </label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all cursor-pointer font-semibold"
              >
                <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                <option value="Evening (4 PM - 12 AM)">Evening (4 PM - 12 AM)</option>
                <option value="Night (12 AM - 8 AM)">Night (12 AM - 8 AM)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Modify Login Password (Optional)
            </label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep existing password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-hospital-500 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 cursor-pointer"
            >
              Save Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation: Toggle Status */}
      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        title="Toggle Staff Status"
        message={`Are you sure you want to toggle shift duties status for ${
          recToToggle ? recToToggle.name : 'this staff'
        }?`}
        confirmText="Confirm Toggle"
        type="warning"
      />

      {/* Confirmation: Delete */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Staff Access"
        message="Are you sure you want to terminate receptionist portal credentials? This action is irreversible."
        confirmText="Remove Access"
        type="danger"
      />

      {/* Modal: View Receptionist Details */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View Receptionist Details" size="md">
        {viewRec && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Receptionist ID</span>
                <span className="text-sm font-semibold text-slate-700">{viewRec.id || viewRec.code}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</span>
                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  viewRec.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>{viewRec.status}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Name</span>
                <span className="text-sm font-semibold text-slate-700">{viewRec.name}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</span>
                <span className="text-sm font-semibold text-slate-700">{viewRec.email}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</span>
                <span className="text-sm font-semibold text-slate-700">{viewRec.phone}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shift Duty</span>
                <span className="text-sm font-semibold text-slate-700">{viewRec.shift}</span>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Password</span>
              <span className="text-sm font-semibold text-slate-500 italic">Hidden for security</span>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-hospital-500 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Receptionists;
