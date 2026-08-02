import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit, Trash2, Clock, Award, Eye } from 'lucide-react';
import ThreeDotMenu from '../../components/common/ThreeDotMenu';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const Doctors = () => {
  const { doctors, addDoctor, editDoctor, deleteDoctor, toggleDoctorStatus } = useHospital();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Confirmation states
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorToToggle, setDoctorToToggle] = useState(null);

  // View modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewDoctor, setViewDoctor] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
  name: '',
  specialization: '',
  phone: '',
  email: '',
  experience: '',
  availability: '',
  status: 'Active'
});

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      specialization: '',
      phone: '',
      email: '',
      experience: '',
      availability: '',
      status: 'Active',
      password: ''
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
      status: doc.status,
      password: ''
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (doc) => {
    setViewDoctor(doc);
    setIsViewOpen(true);
  };

   const handleAddSubmit = async (e) => {
    e.preventDefault();

    const createdDoctor = await addDoctor(formData);

    if (createdDoctor) {
      setIsAddOpen(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDoctor) {
      return;
    }

    const updatedDoctor = await editDoctor(
      selectedDoctor.id,
      formData
    );

    if (updatedDoctor) {
      setIsEditOpen(false);
      setSelectedDoctor(null);
    }
  };

  const triggerStatusToggle = (doc) => {
    setDoctorToToggle(doc);
    setStatusConfirmOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!doctorToToggle) {
      return;
    }

    const updatedDoctor = await toggleDoctorStatus(
      doctorToToggle.id
    );

    if (updatedDoctor) {
      setStatusConfirmOpen(false);
      setDoctorToToggle(null);
    }
  };

  const triggerDelete = (id) => {
    setSelectedDoctorId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoctorId) {
      return;
    }

    const deleted = await deleteDoctor(selectedDoctorId);

    if (deleted) {
      setDeleteConfirmOpen(false);
      setSelectedDoctorId('');
    }
  };

  

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
          <span className="font-bold text-slate-800 block">{row.name}</span>
          <span className="text-[10px] font-semibold text-slate-400 block">{row.email}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      header: 'Specialization',
      sortable: true,
      render: (row) => (
        <span className="inline-block rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-hospital-600 border border-blue-100">
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
    <div className="space-y-6">
      {/* Header */}
<div className="flex flex-col sm:flex-row justify-end">        
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Doctor</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={doctors}
        searchPlaceholder="Search doctors by name or specialty..."
        searchKey="name"
        emptyMessage="No doctors registered in directory"
        itemsPerPage={6}
        actions={(row) => (
          <ThreeDotMenu
            options={[
              {
                label: 'View Details',
                icon: Eye,
                onClick: () => handleOpenView(row)
              },
              {
                label: 'Edit Details',
                icon: Edit,
                onClick: () => handleOpenEdit(row)
              },
              {
                label: 'Remove Doctor',
                icon: Trash2,
                destructive: true,
                onClick: () => triggerDelete(row.id)
              }
            ]}
          />
        )}
      />

      {/* Modal: Add Doctor */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Specialty Doctor" size="md">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Doctor Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Arjun Kumar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Specialization
              </label>
              <input
  type="text"
  required
  value={formData.specialization}
  onChange={(e) =>
    setFormData({
      ...formData,
      specialization: e.target.value
    })
  }
  placeholder="e.g. Orthopedic Surgeon"
  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
/>
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
                placeholder="e.g. 9810543210"
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
                placeholder="e.g. arjun.kumar@roh.com"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Experience Years
              </label>
              <input
                type="text"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="e.g. 15 Years"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Shift Timing
              </label>
              <input
                type="text"
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                placeholder="e.g. 9:00 AM - 1:00 PM"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
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
              Register Doctor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Doctor */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Doctor Credentials" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Doctor Name
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
                Specialization
              </label>
              <input
  type="text"
  required
  value={formData.specialization}
  onChange={(e) =>
    setFormData({
      ...formData,
      specialization: e.target.value
    })
  }
  placeholder="e.g. Orthopedic Surgeon"
  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
/>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Experience Years
              </label>
              <input
                type="text"
                required
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Shift Timing
              </label>
              <input
                type="text"
                required
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
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
              Save Credentials
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Status Toggle */}
      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        title="Change Doctor Active Status"
        message={`Are you sure you want to change the status of ${
          doctorToToggle ? doctorToToggle.name : 'this doctor'
        }? Toggling active status will update their consultation availability.`}
        confirmText="Confirm Status"
        type="warning"
      />

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove Doctor"
        message="Are you sure you want to remove this doctor from the active hospital directory? All scheduled appointment slot data will be affected."
        confirmText="Delete"
        type="danger"
      />

      {/* Modal: View Doctor Details */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="View Doctor Details" size="md">
        {viewDoctor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Doctor ID</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.id || viewDoctor.code}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</span>
                <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  viewDoctor.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>{viewDoctor.status}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Doctor Name</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.name}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Specialization</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.specialization}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.email}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone Number</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.phone}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Experience Years</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.experience}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Shift Timing</span>
                <span className="text-sm font-semibold text-slate-700">{viewDoctor.availability}</span>
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

export default Doctors;
