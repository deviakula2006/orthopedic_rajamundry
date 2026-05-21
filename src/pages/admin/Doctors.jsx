import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Mail, Phone, Clock, Award, ShieldAlert } from 'lucide-react';

const Doctors = () => {
  const { doctors, addDoctor, editDoctor, deleteDoctor, toggleDoctorStatus } = useHospital();
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    specialization: 'Joint Replacement Surgeon',
    phone: '',
    email: '',
    experience: '',
    availability: '',
    status: 'Active'
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      specialization: 'Joint Replacement Surgeon',
      phone: '',
      email: '',
      experience: '',
      availability: '',
      status: 'Active'
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name,
      specialization: doc.specialization,
      phone: doc.phone,
      email: doc.email,
      experience: doc.experience,
      availability: doc.availability,
      status: doc.status
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addDoctor(formData);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editDoctor(selectedDoctor.id, formData);
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this doctor from the roster?")) {
      deleteDoctor(id);
    }
  };

  const specializations = [
    'Orthopedic Surgeon',
    'Joint Replacement Surgeon',
    'Spine Surgery Specialist',
    'Sports Medicine Specialist',
    'Pediatric Orthopedist',
    'Physiotherapist',
    'Anesthesiologist',
    'Radiologist',
    'General Physician'
  ];

  const columns = [
    {
      key: 'id',
      header: 'Doctor ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-500">{row.id}</span>
    },
    {
      key: 'name',
      header: 'Doctor Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.name}</span>
          <span className="text-[10px] font-semibold text-slate-400 block">{row.email}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      header: 'Specialization',
      sortable: true,
      render: (row) => (
        <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-hospital-600 border border-blue-100">
          {row.specialization}
        </span>
      )
    },
    {
      key: 'availability',
      header: 'Shift / Timing',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.availability}</span>
        </div>
      )
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Award className="h-3.5 w-3.5 text-slate-400" />
          <span>{row.experience}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => toggleDoctorStatus(row.id)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all border ${
            row.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          }`}
          title="Click to toggle status"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          {row.status}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Medical Panel (Doctors)</h1>
          <p className="text-xs text-slate-400 font-semibold">Manage specialty orthopedic consultants and scheduling slots</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={doctors}
        searchPlaceholder="Search doctors by name or specialization..."
        searchKey="name"
        emptyMessage="No medical panelists found matching search criteria"
        itemsPerPage={5}
        actions={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-hospital-600 transition-colors"
              title="Edit Doctor Details"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Remove Doctor"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modal: Add Doctor */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Roster Doctor">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Doctor Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specialization Area</label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Experience (Years/details)</label>
              <input
                type="text"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 12 Years"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Daily Roster Timing Slot</label>
              <input
                type="text"
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="e.g. 9:00 AM - 1:00 PM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
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
              Roster Doctor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Doctor */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Doctor Credentials: ${selectedDoctor?.id}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Doctor Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Specialization Area</label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Experience (Years/details)</label>
              <input
                type="text"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Daily Roster Timing Slot</label>
              <input
                type="text"
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
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
              Save Credentials
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Doctors;
