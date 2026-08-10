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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>Settings</h1>
        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>Configure admin profile, credentials, and hospital information</p>
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
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-sm font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60"
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
