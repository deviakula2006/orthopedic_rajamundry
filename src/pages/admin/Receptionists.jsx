import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Clock, Mail, ShieldAlert } from 'lucide-react';

const Receptionists = () => {
  const { receptionists, addReceptionist, editReceptionist, deleteReceptionist } = useHospital();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);

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
      status: 'Active'
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
      status: rec.status
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addReceptionist(formData);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editReceptionist(selectedRec.id, formData);
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this receptionist's access?")) {
      deleteReceptionist(id);
    }
  };

  const shifts = [
    'Morning (8 AM - 4 PM)',
    'Evening (4 PM - 12 AM)',
    'Night (12 AM - 8 AM)',
    'General Shift (9 AM - 5 PM)'
  ];

  const columns = [
    {
      key: 'id',
      header: 'Staff ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-500">{row.id}</span>
    },
    {
      key: 'name',
      header: 'Receptionist Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.name}</span>
          <span className="text-[10px] font-semibold text-slate-400 block">{row.email}</span>
        </div>
      )
    },
    {
      key: 'shift',
      header: 'Roster Shift',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.shift}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone Number'
    },
    {
      key: 'status',
      header: 'Access Status',
      render: (row) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold border ${
          row.status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Receptionist Staff</h1>
          <p className="text-xs text-slate-400 font-semibold">Register and manage desk assistants and appointment intake roles</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Register Staff</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={receptionists}
        searchPlaceholder="Search receptionists..."
        searchKey="name"
        emptyMessage="No receptionist personnel registered"
        itemsPerPage={5}
        actions={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-hospital-600 transition-colors"
              title="Edit Staff Member"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete Staff"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modal: Add Receptionist */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Front Desk Staff">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Staff Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duty Shift Hours</label>
            <select
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
            >
              {shifts.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-hospital-500 text-sm font-bold text-white shadow-premium hover:bg-hospital-600"
            >
              Hire Receptionist
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Receptionist */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Modify Receptionist: ${selectedRec?.id}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Staff Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duty Shift Hours</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {shifts.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Access Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-hospital-500 text-sm font-bold text-white shadow-premium hover:bg-hospital-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Receptionists;
