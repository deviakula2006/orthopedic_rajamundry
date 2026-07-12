import React, { useState, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Eye, Edit, Trash2, Calendar, UserPlus, Search, UserCheck } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Modals
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';

const Patients = () => {
  const { patients, addPatient, editPatient, deletePatient } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Save flow
  // Save flow
const handleSavePatient = async (patientData, bookAppointment = false) => {
  const newPatient = await addPatient(patientData);

  if (newPatient && bookAppointment) {
    setSelectedPatientId(newPatient.id);
    setAppointmentModalOpen(true);
  }

  return newPatient;
};

const handleEditPatient = async (id, patientData) => {
  return await editPatient(id, patientData);
};

const handleConfirmDelete = async () => {
  if (!selectedPatientId) {
    return;
  }

  const deleted = await deletePatient(selectedPatientId);

  if (deleted) {
    setDeleteConfirmOpen(false);
    setSelectedPatientId('');
  }
};

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [patients, searchQuery]);

  const columns = [
    {
  key: 'code',
  header: 'Patient ID',
  sortable: true,
  render: (row) => (
    <span className="font-bold text-hospital-600">
      {row.code}
    </span>
  )
},
    {
      key: 'name',
      header: 'Patient Name',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{row.name}</span>
    },
    {
      key: 'age',
      header: 'Age / Gender',
      render: (row) => (
        <span>
          {row.age} Yrs / {row.gender}
        </span>
      )
    },
    {
      key: 'phone',
      header: 'Phone Number'
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (row) => (
        <span className="inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 border border-red-100">
          {row.bloodGroup || 'O+'}
        </span>
      )
    },
    {
  key: 'lastVisitDate',
  header: 'Last Visit',
  sortable: true,
  render: (row) => (
    <span className="text-slate-400 font-semibold">
      {row.lastVisitDate || '-'}
    </span>
  )
}
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients by name, phone, or ID..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-hospital-500 focus:outline-none focus:ring-1 focus:ring-hospital-500 transition-all shadow-sm"
        />
      </div>
        <button
          type="button"
          onClick={() => {
            setSelectedPatient(null);
            setPatientModalOpen(true);
          }}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none cursor-pointer"
        >

          <Plus className="h-4 w-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Custom Search Box */}
      

      {/* Patient Table or Searched Patient Not Found Button */}
      {filteredPatients.length === 0 && searchQuery.trim() !== '' ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 bg-white rounded-2xl text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-hospital-500 shadow-inner">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Searched Patient Not Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              " {searchQuery} " does not match any registered patients.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPatientModalOpen(true)}
            className="rounded-xl bg-hospital-500 hover:bg-hospital-600 text-xs font-bold text-white py-2.5 px-6 shadow-premium transition-all cursor-pointer"
          >
            Add Patient
          </button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredPatients}
          emptyMessage="No patient records found"
          itemsPerPage={6}
          actions={(row) => (
            <ThreeDotMenu
              options={[
                {
                  label: 'View EMR File',
                  icon: Eye,
                  onClick: () => {
                    setSelectedPatient(row);
                    setViewModalOpen(true);
                  }
                },
                {
                  label: 'Edit Details',
                  icon: Edit,
                  onClick: () => {
                    setSelectedPatient(row);
                    setPatientModalOpen(true);
                  }
                },
                {
                  label: 'Book Appointment',
                  icon: Calendar,
                  onClick: () => {
                    setSelectedPatientId(row.id);
                    setAppointmentModalOpen(true);
                  }
                },
                {
                  label: 'Delete Record',
                  icon: Trash2,
                  destructive: true,
                  onClick: () => {
                    setSelectedPatientId(row.id);
                    setDeleteConfirmOpen(true);
                  }
                }
              ]}
            />
          )}
        />
      )}

      {/* Modal: View Demographics Details */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Patient Demographics" size="md">
        {selectedPatient && (
          <div className="space-y-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-3 border-b pb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-hospital-500">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{selectedPatient.name}</h4>
                <span className="text-[10px] text-slate-400 block mt-0.5">
  ID: {selectedPatient.code}
</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age & Gender</span>
                <p className="text-slate-800 mt-1">{selectedPatient.age} Yrs / {selectedPatient.gender}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Blood Group</span>
                <p className="text-slate-800 mt-1">{selectedPatient.bloodGroup || 'O+'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <p className="text-slate-800 mt-1">{selectedPatient.phone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diagnosis / Disease</span>
                <p className="text-slate-800 mt-1">
  {selectedPatient.diagnosis || 'General checkup'}
</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address</span>
              <p className="text-slate-700 bg-slate-50 border p-3 rounded-xl mt-1.5 leading-relaxed">{selectedPatient.address || 'Danavaipeta, Rajahmundry'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Global Add/Edit Patient Modal */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={selectedPatient ? (data) => handleEditPatient(selectedPatient.id, data) : handleSavePatient}
        patient={selectedPatient}
      />

      {/* Global Appointment Booking Modal */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        initialPatientId={selectedPatientId}
      />

      {/* Destructive Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient file? All clinical history and appointments will be lost."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Patients;
