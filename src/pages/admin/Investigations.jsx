import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Activity, ShieldCheck } from 'lucide-react';

const Investigations = () => {
  const { investigations, addInvestigation, editInvestigation, deleteInvestigation } = useHospital();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  const [formData, setFormData] = useState({
    testName: '',
    category: 'Radiology',
    price: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      testName: '',
      category: 'Radiology',
      price: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (inv) => {
    setSelectedInv(inv);
    setFormData({
      testName: inv.testName,
      category: inv.category,
      price: inv.price
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addInvestigation({
      testName: formData.testName,
      category: formData.category,
      price: parseFloat(formData.price)
    });
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editInvestigation(selectedInv.id, {
      testName: formData.testName,
      category: formData.category,
      price: parseFloat(formData.price)
    });
    setIsEditOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this investigation test profile?")) {
      deleteInvestigation(id);
    }
  };

  const testCategories = [
    'Radiology',
    'Pathology',
    'Cardiology',
    'Orthotics & Prosthetics',
    'Neurology',
    'General Diagnostics'
  ];

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
      sortable: true
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <span className="inline-block rounded-md bg-slate-50 border px-2 py-0.5 text-xs font-bold text-slate-500">
          {row.category}
        </span>
      )
    },
    {
      key: 'price',
      header: 'Price (INR)',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-slate-700">
          ₹{row.price}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laboratory Investigations</h1>
          <p className="text-xs text-slate-400 font-semibold">Manage orthopedic diagnostic test profiles and billing catalog rates</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none"
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-hospital-600 transition-colors"
              title="Edit Test Rates"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete Profile"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modal: Add Investigation */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Lab Investigation">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Test Name</label>
            <input
              type="text"
              required
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder="e.g. Spine MRI, Joint Fluid Analysis"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {testCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rate / Cost (₹)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="₹ Rate"
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
              Publish Test Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Investigation */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Modify Rates: ${selectedInv?.id}`}>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Test Name</label>
            <input
              type="text"
              required
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {testCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rate / Cost (₹)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Investigations;
