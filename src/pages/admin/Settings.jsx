import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHospital } from '../../context/HospitalContext';
import { User, Shield, Building, Save, Clock, Bell, Image } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useHospital();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || 'Admin');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@roh.com');

  // Password forms
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hospital details forms
  const [hospName, setHospName] = useState('Rajahmundry Orthopedic Hospital');
  const [hospAddr, setHospAddr] = useState('Danavaipeta, Tilak Road, Rajahmundry, Andhra Pradesh, 533103');
  const [hospContact, setHospContact] = useState('+91 883 244 5566');
  const [hospLic, setHospLic] = useState('AP-MED-ROH-2026-981');
  
  // Working hours
  const [workingHours, setWorkingHours] = useState('24 Hours (Emergency) | OPD: 09:00 AM - 06:00 PM');

  // Notification Preferences
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySMS, setNotifySMS] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  // Logo file mockup state
  const [logoFile, setLogoFile] = useState(null);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(profileName, profileEmail);
    showToast('Profile details updated successfully!');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    showToast('Access credentials updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleHospSubmit = (e) => {
    e.preventDefault();
    showToast('Hospital configuration details saved successfully!');
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    showToast('Alerting preferences stored!');
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(URL.createObjectURL(e.target.files[0]));
      showToast('Hospital logo uploaded successfully!');
    }
  };

  const tabs = [
   
    { id: 'profile', name: 'Admin Profile', icon: User },
    { id: 'security', name: 'Access Security', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Settings Navigation Sidebar */}
        <div className="w-full shrink-0 lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
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

        {/* Settings Tab Panels */}
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-premium">
          

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 uppercase tracking-wider">
                Modify Admin Profile
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Administrative Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none transition-colors cursor-pointer"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Update Profile</span>
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 uppercase tracking-wider">
                Access Credentials & Security
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none max-w-md"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:border-hospital-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-hospital-500 px-5 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 focus:outline-none transition-colors cursor-pointer"
              >
                <Save className="h-4.5 w-4.5" />
                <span>Save Credentials</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
