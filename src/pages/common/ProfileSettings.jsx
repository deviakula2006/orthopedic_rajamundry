import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import apiClient from '../../services/api';
import {
  User,
  Shield,
  Save,
  Lock,
  Phone,
  Mail,
  Briefcase,
  Clock,
  Award,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import TimeRangePicker from '../../components/common/TimeRangePicker';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useHospital();

  const [activeTab, setActiveTab] = useState('profile');
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [shift, setShift] = useState('');
  const [doctorCode, setDoctorCode] = useState('');
  const [receptionistCode, setReceptionistCode] = useState('');
  const [status, setStatus] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Load latest live user & profile data from /auth/me
  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      try {
        setLoadingProfile(true);
        const res = await apiClient.get('/auth/me');
        const data = res.data?.data;
        if (data && isMounted) {
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setSpecialization(data.specialization || '');
          setExperienceYears(data.experienceYears != null ? String(data.experienceYears) : '');
          setAvailabilityNote(data.availability || '');
          setShift(data.shift || 'Morning (8 AM - 4 PM)');
          setDoctorCode(data.doctorCode || '');
          setReceptionistCode(data.receptionistCode || '');
          setStatus(data.status || 'Active');
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchMe();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const payload = {
        name,
        email,
        phone: phone || undefined
      };

      if (user?.role === 'Doctor') {
        payload.specialization = specialization;
        payload.experienceYears = experienceYears ? parseInt(experienceYears, 10) : undefined;
        payload.availabilityNote = availabilityNote;
      } else if (user?.role === 'Receptionist') {
        payload.shift = shift;
      }

      const updatedUser = await updateProfile(payload);

      if (updatedUser) {
        setName(updatedUser.name || '');
        setEmail(updatedUser.email || '');
        if (updatedUser.phone !== undefined) setPhone(updatedUser.phone || '');
        if (updatedUser.specialization !== undefined) setSpecialization(updatedUser.specialization || '');
        if (updatedUser.availability !== undefined) setAvailabilityNote(updatedUser.availability || '');
        if (updatedUser.shift !== undefined) setShift(updatedUser.shift || '');
      }

      showToast('Profile information updated successfully!');
    } catch (err) {
      showToast(
        err.response?.data?.error?.message || 'Failed to update profile.',
        'error'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }

    setIsSavingPassword(true);

    try {
      await apiClient.patch('/auth/password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      showToast('Password credentials changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(
        err.response?.data?.error?.message || 'Failed to change password.',
        'error'
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'User Profile', icon: User },
    { id: 'security', name: 'Security & Password', icon: Shield }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>
          Profile & Account Settings
        </h1>
        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#475569', marginTop: 2 }}>
          Manage your personal staff identity, consultation credentials, and system access password
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Navigation Tabs */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  borderRadius: 8,
                  width: '100%',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 120ms',
                  border: 'none',
                  background: isActive ? '#2278e8' : 'transparent',
                  color: isActive ? '#ffffff' : '#111827'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {tab.name}
              </button>
            );
          })}

          {/* Quick Staff Info Badge */}
          <div className="p-3.5 mt-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Role</span>
              <span className="font-bold text-hospital-600 bg-hospital-50 border border-hospital-200 px-2 py-0.5 rounded-full text-[10px]">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Username</span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                {user?.username}
              </span>
            </div>
            {(doctorCode || receptionistCode) && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Staff Code</span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {doctorCode || receptionistCode}
                </span>
              </div>
            )}
            {status && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Status</span>
                <span className="font-bold text-emerald-600 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Card */}
        <div className="card" style={{ flex: 1, minWidth: 0, padding: '1.5rem' }}>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-hospital-500" />
              <span>Loading saved account information...</span>
            </div>
          ) : activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-hospital-500" />
                  Staff Profile Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your official information registered in the hospital database
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Account Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.role || ''}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3.5 text-sm font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role-specific Fields: Doctor */}
              {user?.role === 'Doctor' && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-hospital-600 uppercase tracking-wider">
                    Doctor Clinical Specialization & Experience
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Clinical Specialization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Orthopedic Surgeon"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="70"
                        placeholder="e.g. 12"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="pt-1">
                    <TimeRangePicker
                      value={availabilityNote || '08:30 AM – 04:00 PM'}
                      onChange={(val) => setAvailabilityNote(val)}
                      label="Duty Shift Working Hours"
                    />
                  </div>
                </div>
              )}

              {/* Role-specific Fields: Receptionist */}
              {user?.role === 'Receptionist' && (
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-hospital-600 uppercase tracking-wider">
                    Receptionist Roster Details
                  </h4>
                  <div className="pt-1">
                    <TimeRangePicker
                      value={shift || '08:00 AM – 04:00 PM'}
                      onChange={(val) => setShift(val)}
                      label="Assigned Duty Shift Hours"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-hospital-500" />
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update your authentication credentials using your current password
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-800 focus:border-hospital-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword || !currentPassword || !newPassword}
                  className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none disabled:opacity-60 cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
