import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import apiClient from '../../services/api';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('pending');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(() => {
    setIsLoading(true);
    setError(null);

    const params = {};
    if (user?.doctorId) {
      params.doctorId = user.doctorId;
    }

    apiClient
      .get('/doctors/dashboard', { params })
      .then((res) => {
        if (res.data?.data) {
          setDashboardData(res.data.data);
        } else {
          setDashboardData(null);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch doctor dashboard from API:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load doctor workstation');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboard();
    });
  }, [fetchDashboard]);

  const metrics = dashboardData?.metrics || {
    totalAppointments: 0,
    pendingConsultations: 0,
    completedConsultations: 0
  };

  const queueItems = dashboardData?.queue || [];

  const filteredAppointments = queueItems.filter((a) => {
    if (activeFilter === 'pending') {
      return a.status === 'Checked In' || a.status === 'Scheduled' || a.status === 'In Consultation';
    }
    if (activeFilter === 'completed') {
      return a.status === 'Completed';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Clinic Welcome & Date Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-hospital-700 via-hospital-600 to-blue-700 rounded-2xl p-6 text-white shadow-premium">
        <div>
          <span className="inline-block rounded bg-white/20 text-[10px] font-bold text-white px-2.5 py-1 uppercase mb-2 backdrop-blur-sm">
            ROH Doctor Workstation 2.0
          </span>
          <h2 className="text-xl font-black tracking-tight leading-none">
            Welcome, Dr. {user?.name || user?.fullName || 'Doctor'}
          </h2>
          <p className="text-xs text-blue-100 font-semibold mt-1.5 opacity-90">
            Consultation desk is active. Select any patient card to review history or record notes.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
          <Calendar className="h-5 w-5 text-blue-200" />
          <span className="text-xs font-extrabold">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Error State with Retry Button */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Failed to load workstation data</h3>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* 3 Clickable KPI Cards - Dynamic from PostgreSQL */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Card 1: Today's Appointments */}
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`text-left rounded-2xl border p-5 shadow-premium transition-all duration-300 transform cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-gradient-to-br from-hospital-600 to-blue-700 border-hospital-600 text-white shadow-md scale-[1.01] -translate-y-0.5'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-hospital-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>Today's Appointments</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-blue-50 text-hospital-600 border border-blue-100'}`}>
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black block leading-none">{metrics.totalAppointments}</span>
            <span className={`text-[10px] font-bold block mt-1.5 ${activeFilter === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>Total patient consultations</span>
          </div>
        </button>

        {/* Card 2: Pending Consultations */}
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`text-left rounded-2xl border p-5 shadow-premium transition-all duration-300 transform cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500 text-white shadow-md scale-[1.01] -translate-y-0.5'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'pending' ? 'text-amber-100' : 'text-slate-400'}`}>Pending Consultations</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black block leading-none">{metrics.pendingConsultations}</span>
            <span className={`text-[10px] font-bold block mt-1.5 ${activeFilter === 'pending' ? 'text-amber-100' : 'text-slate-400'}`}>In waitlist queue</span>
          </div>
        </button>

        {/* Card 3: Completed Consultations */}
        <button
          type="button"
          onClick={() => setActiveFilter('completed')}
          className={`text-left rounded-2xl border p-5 shadow-premium transition-all duration-300 transform cursor-pointer ${
            activeFilter === 'completed'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-md scale-[1.01] -translate-y-0.5'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'completed' ? 'text-emerald-100' : 'text-slate-400'}`}>Completed Consultations</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${activeFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black block leading-none">{metrics.completedConsultations}</span>
            <span className={`text-[10px] font-bold block mt-1.5 ${activeFilter === 'completed' ? 'text-emerald-100' : 'text-slate-400'}`}>Completed today</span>
          </div>
        </button>
      </div>

      {/* Patient Cards Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Patient Consultation Queue ({filteredAppointments.length})
          </h3>
          <span className="text-[10px] font-black text-hospital-600 uppercase tracking-wider bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
            Filter: {activeFilter.toUpperCase()}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8">
            <SkeletonLoader count={3} type="card" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.map((apt) => {
              const targetPatientId = apt.patientDbId || apt.patientId;
              
              let leftBorderColor = 'border-l-sky-500 border-l-[5px]';
              let complaintBgColor = 'bg-sky-50/60 border-sky-100/60';
              let complaintLabelColor = 'text-sky-500';
              
              if (apt.priority === 'Emergency' || apt.type === 'Emergency') {
                leftBorderColor = 'border-l-rose-500 border-l-[5px]';
                complaintBgColor = 'bg-rose-50/60 border-rose-100/60';
                complaintLabelColor = 'text-rose-600 font-extrabold';
              } else if (apt.priority === 'Follow-up' || apt.type === 'Follow Up') {
                leftBorderColor = 'border-l-amber-500 border-l-[5px]';
                complaintBgColor = 'bg-amber-50/60 border-amber-100/60';
                complaintLabelColor = 'text-amber-600 font-extrabold';
              }

              return (
                <div
                  key={apt.appointmentId || apt.appointmentCode}
                  onClick={() => navigate(`/doctor/patient/${targetPatientId}`)}
                  className={`border border-slate-200 bg-white rounded-2xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 cursor-pointer flex flex-col justify-between h-[210px] active:scale-[0.99] group border-l-4 ${leftBorderColor} hover:-translate-y-0.5`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-800 group-hover:text-hospital-600 transition-colors leading-tight truncate">
                          {apt.patientName}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wide">
                          ID: {apt.patientId} &bull; {apt.patientGender || 'Patient'} &bull; {apt.patientAge ?? 'N/A'} Yrs
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                        {apt.time}
                      </span>
                    </div>

                    <div className={`mt-3 border rounded-xl p-3 shadow-inner ${complaintBgColor}`}>
                      <span className={`text-[8px] font-black uppercase tracking-wider block ${complaintLabelColor}`}>
                        {apt.type === 'Emergency' ? '⚠️ Emergency Complaint' : 'Chief Complaint'}
                      </span>
                      <p className="text-xs font-extrabold text-slate-700 line-clamp-2 mt-0.5 leading-snug">
                        {apt.chiefComplaint || 'Consultation Checkup'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Slot: {apt.type}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              );
            })}

            {filteredAppointments.length === 0 && !error && (
              <div className="col-span-full">
                <EmptyState
                  title="No Patients in Queue"
                  message={`There are no ${activeFilter} patient appointments assigned to your workstation today.`}
                />
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default DoctorDashboard;
