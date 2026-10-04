import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { User, Shield, Building, Save, Sliders, Plus, Edit2, CheckCircle2, XCircle, Percent, Layers } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

// Hospital Metadata Form
const HospitalMetadataForm = ({ settings, onSave }) => {
  const [hospName, setHospName] = useState(settings?.name || '');
  const [hospAddr, setHospAddr] = useState(settings?.address || '');
  const [hospContact, setHospContact] = useState(settings?.contactPhone || '');
  const [hospLic, setHospLic] = useState(settings?.licenseNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setHospName(settings.name || '');
      setHospAddr(settings.address || '');
      setHospContact(settings.contactPhone || '');
      setHospLic(settings.licenseNumber || '');
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name: hospName,
        address: hospAddr,
        contactPhone: hospContact,
        licenseNumber: hospLic
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-base font-bold text-slate-800 border-b pb-3 mb-4">Hospital Organization Details</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hospital Facility Name</label>
          <input
            type="text"
            required
            value={hospName}
            onChange={(e) => setHospName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">License Registration No</label>
          <input
            type="text"
            required
            value={hospLic}
            onChange={(e) => setHospLic(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact Landline / Phone</label>
          <input
            type="text"
            required
            value={hospContact}
            onChange={(e) => setHospContact(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Facility Location / Address</label>
          <input
            type="text"
            required
            value={hospAddr}
            onChange={(e) => setHospAddr(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{isSaving ? 'Saving...' : 'Save Metadata'}</span>
        </button>
      </div>
    </form>
  );
};

// Hospital Management: Appointment Types & GST Configuration
const HospitalManagementTab = ({
  appointmentTypes,
  onAddAppointmentType,
  onUpdateAppointmentType,
  onToggleStatus,
  hospitalSettings,
  onUpdateSettings
}) => {
  // New appointment type state
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeFee, setNewTypeFee] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit appointment type modal state
  const [editingType, setEditingType] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState('');
  const [isUpdatingType, setIsUpdatingType] = useState(false);

  // GST State
  const [gstRate, setGstRate] = useState(hospitalSettings?.gstRate ?? 0);
  const [isSavingGst, setIsSavingGst] = useState(false);

  useEffect(() => {
    if (hospitalSettings?.gstRate !== undefined) {
      setGstRate(hospitalSettings.gstRate);
    }
  }, [hospitalSettings]);

  // Handle Add Appointment Type
  const handleAddTypeSubmit = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    setIsAddingType(true);
    try {
      const created = await onAddAppointmentType({
        name: newTypeName.trim(),
        defaultFee: parseFloat(newTypeFee) || 0,
        isActive: true
      });
      if (created) {
        setNewTypeName('');
        setNewTypeFee('');
        setShowAddForm(false);
      }
    } finally {
      setIsAddingType(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (t) => {
    setEditingType(t);
    setEditName(t.name);
    setEditFee(String(t.defaultFee));
  };

  // Handle Update Appointment Type
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingType || !editName.trim()) return;

    setIsUpdatingType(true);
    try {
      const updated = await onUpdateAppointmentType(editingType.id, {
        name: editName.trim(),
        defaultFee: parseFloat(editFee) || 0
      });
      if (updated) {
        setEditingType(null);
      }
    } finally {
      setIsUpdatingType(false);
    }
  };

  // Handle Save GST Rate
  const handleSaveGst = async (e) => {
    e.preventDefault();
    setIsSavingGst(true);
    try {
      await onUpdateSettings({
        gstRate: parseFloat(gstRate) || 0
      });
    } finally {
      setIsSavingGst(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ─── 1. APPOINTMENT CONFIGURATION ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-hospital-500" />
              Appointment Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage hospital appointment types, standard consultation fees, and availability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hospital-50 text-hospital-700 hover:bg-hospital-100 text-xs font-bold border border-hospital-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Add Form' : 'Add Appointment Type'}</span>
          </button>
        </div>

        {/* Add New Type Inline Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddTypeSubmit}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Create New Appointment Type
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physiotherapy, Specialist Consultation"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Default Fee (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="e.g. 600"
                  value={newTypeFee}
                  onChange={(e) => setNewTypeFee(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 focus:border-hospital-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingType || !newTypeName.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-hospital-500 text-white text-xs font-bold hover:bg-hospital-600 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isAddingType ? 'Creating...' : 'Save Appointment Type'}
              </button>
            </div>
          </form>
        )}

        {/* Appointment Types List / Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Appointment Type</th>
                <th className="px-4 py-3 text-right">Standard Fee (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {appointmentTypes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No appointment types configured.
                  </td>
                </tr>
              ) : (
                appointmentTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {t.code || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{t.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      ₹{t.defaultFee}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          t.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {t.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-slate-600 hover:text-hospital-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Type and Price"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(t.id)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border ${
                            t.isActive
                              ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 2. BILLING & GST CONFIGURATION ─── */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="border-b pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-4 h-4 text-hospital-500" />
            Billing & GST Tax Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hospital-wide Goods & Services Tax (GST) applied to invoice sub-totals.
          </p>
        </div>

        <form onSubmit={handleSaveGst} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Standard GST Rate (%)
            </label>
            <div className="relative flex items-center max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-sm font-bold text-slate-800 focus:border-hospital-500 focus:outline-none"
              />
              <span className="absolute right-3 text-slate-400 font-bold text-xs">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Default is 0% (Tax exempt). Invoices calculate tax as Taxable Amount × (GST% / 100).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSavingGst}
              className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingGst ? 'Saving GST...' : 'Save GST Rate'}</span>
            </button>
            <span className="text-xs font-bold text-slate-500">
              Active setting: {hospitalSettings?.gstRate ?? 0}% GST
            </span>
          </div>
        </form>
      </div>

      {/* Edit Appointment Type Modal */}
      {editingType && (
        <Modal
          isOpen={Boolean(editingType)}
          onClose={() => setEditingType(null)}
          title={`Edit Appointment Type — ${editingType.name}`}
          size="sm"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Appointment Type Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Default Standard Fee (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={editFee}
                onChange={(e) => setEditFee(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingType || !editName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-hospital-500 hover:bg-hospital-600 rounded-xl shadow-premium cursor-pointer disabled:opacity-50"
              >
                {isUpdatingType ? 'Saving...' : 'Update Type'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const {
    showToast,
    hospitalSettings,
    updateHospitalSettings,
    appointmentTypes,
    addAppointmentType,
    updateAppointmentType,
    toggleAppointmentTypeStatus
  } = useHospital();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || 'Super Admin');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@roh.com');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileName, profileEmail);
      showToast("Profile details updated successfully!");
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to update profile", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match!", "error");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast("System credentials updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.error?.message || "Failed to update password", "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Admin Profile', icon: User },
    { id: 'security', name: 'Access Security', icon: Shield },
    { id: 'hospital', name: 'Hospital Metadata', icon: Building },
    { id: 'management', name: 'Hospital Management', icon: Sliders }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>Settings</h1>
        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
          Configure admin profile, credentials, hospital metadata, appointment types, and billing GST
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Tab navigation */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 8, width: '100%',
                  fontSize: '0.8125rem', fontWeight: 600, textAlign: 'left',
                  cursor: 'pointer', transition: 'all 120ms', border: 'none',
                  background: isActive ? '#2278e8' : 'transparent',
                  color: isActive ? '#ffffff' : '#111827',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f3f4f6'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="card" style={{ flex: 1, minWidth: 0, padding: '1.5rem' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f3f4', paddingBottom: '0.75rem' }}>Admin Profile</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Administrative Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isUpdatingProfile ? 'Updating...' : 'Update Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f3f4', paddingBottom: '0.75rem' }}>Security & Credentials</h3>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none max-w-md"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isUpdatingPassword ? 'Saving...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'hospital' &&
            (hospitalSettings ? (
              <HospitalMetadataForm settings={hospitalSettings} onSave={updateHospitalSettings} />
            ) : (
              <p className="text-sm text-slate-400">Loading hospital details…</p>
            ))}

          {activeTab === 'management' && (
            <HospitalManagementTab
              appointmentTypes={appointmentTypes}
              onAddAppointmentType={addAppointmentType}
              onUpdateAppointmentType={updateAppointmentType}
              onToggleStatus={toggleAppointmentTypeStatus}
              hospitalSettings={hospitalSettings}
              onUpdateSettings={updateHospitalSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
