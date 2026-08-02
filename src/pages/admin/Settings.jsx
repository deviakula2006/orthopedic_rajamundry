import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { User, Shield, Building, Save } from 'lucide-react';

// Local state is initialized directly from `settings` via useState's lazy
// initializer (no effect needed) — this component only mounts once
// `hospitalSettings` has actually loaded, so the initial values are correct
// on first render and there's nothing external to re-sync afterward.
const HospitalMetadataForm = ({ settings, onSave }) => {
  const [hospName, setHospName] = useState(settings.name || '');
  const [hospAddr, setHospAddr] = useState(settings.address || '');
  const [hospContact, setHospContact] = useState(settings.contactPhone || '');
  const [hospLic, setHospLic] = useState(settings.licenseNumber || '');
  const [isSaving, setIsSaving] = useState(false);

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
          className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{isSaving ? 'Saving...' : 'Save Metadata'}</span>
        </button>
      </div>
    </form>
  );
};

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast, hospitalSettings, updateHospitalSettings } = useHospital();

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
    { id: 'hospital', name: 'Hospital Metadata', icon: Building }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 font-semibold">Configure administrative accounts, security keys, and hospital contact registries</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Navigation Sidebar inside Settings */}
        <div className="w-full shrink-0 lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-hospital-500 to-cyanic-500 text-white border-transparent shadow-premium'
                    : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab panels container */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-premium">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b pb-3 mb-4">Modify Admin Profile</h3>

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
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isUpdatingProfile ? 'Updating...' : 'Update Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <h3 className="text-base font-bold text-slate-800 border-b pb-3 mb-4">Access Credentials & Security</h3>

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
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60"
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
        </div>
      </div>
    </div>
  );
};

export default Settings;
