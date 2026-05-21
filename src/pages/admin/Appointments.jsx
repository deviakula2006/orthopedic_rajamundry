import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Check, X, Calendar, Clock, DollarSign, Stethoscope, User } from 'lucide-react';

const Appointments = () => {
  const {
    appointments,
    patients,
    doctors,
    addAppointment,
    editAppointment,
    updateAppointmentStatus,
    deleteAppointment
  } = useHospital();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '10:00 AM',
    type: 'Consultation',
    fee: 500
  });

  const handleOpenAdd = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Consultation',
      fee: 500
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setSelectedApt(apt);
    setFormData({
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      date: apt.date,
      time: apt.time,
      type: apt.type,
      fee: apt.fee
    });
    setIsEditOpen(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addAppointment(formData);
    setIsAddOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editAppointment(selectedApt.id, formData);
    setIsEditOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
            {status}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-100">
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-hospital-700 border border-blue-100">
            {status}
          </span>
        );
    }
  };

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
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 border text-slate-500 font-bold text-xs uppercase">
            {row.patientName ? row.patientName[0] : 'P'}
          </div>
          <div>
            <span className="font-bold text-slate-800 block">{row.patientName}</span>
            <span className="text-[10px] font-semibold text-slate-400 block">{row.patientId}</span>
          </div>
        </div>
      )
    },
    {
      key: 'doctorName',
      header: 'Assigned Consultant',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Stethoscope className="h-4 w-4 text-hospital-500" />
          <span>{row.doctorName}</span>
        </div>
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
      render: (row) => getStatusBadge(row.status)
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Appointment Scheduler</h1>
          <p className="text-xs text-slate-400 font-semibold">Schedule patient checkups and follow-up orthotic sessions</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={appointments}
        searchPlaceholder="Search by patient name..."
        searchKey="patientName"
        emptyMessage="No appointments scheduled currently"
        itemsPerPage={6}
        actions={(row) => (
          <div className="flex items-center gap-1.5">
            {row.status === 'Scheduled' && (
              <>
                <button
                  onClick={() => updateAppointmentStatus(row.id, 'Completed')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-500 hover:bg-emerald-50 transition-colors"
                  title="Mark Completed"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => updateAppointmentStatus(row.id, 'Cancelled')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Cancel Booking"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => deleteAppointment(row.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Delete Reference"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modal: Add Appointment */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Schedule Orthopedic Checkup">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Registered Patient</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {patients.map((pat) => (
                  <option key={pat.id} value={pat.id}>{pat.name} ({pat.id})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Doctor Consultant</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Stethoscope className="h-4 w-4" />
              </span>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Scheduled Date</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Scheduled Time Slot</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Clock className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="e.g. 10:30 AM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Appointment Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              >
                <option value="Consultation">Consultation</option>
                <option value="Therapy">Therapy / Rehab</option>
                <option value="Surgery Checkup">Surgery Checkup</option>
                <option value="Follow Up">Follow Up</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Consultation Fee (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <DollarSign className="h-4 w-4" />
                </span>
                <input
                  type="number"
                  required
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                />
              </div>
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
              Schedule Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Appointments;
