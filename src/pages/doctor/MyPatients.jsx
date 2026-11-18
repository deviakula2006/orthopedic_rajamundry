import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Calendar, ArrowLeft, RefreshCw, AlertCircle, Phone, Stethoscope } from 'lucide-react';
import apiClient from '../../services/api';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const MyPatients = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/doctors/my-patients', {
        params: query.trim() ? { search: query.trim() } : {}
      });
      setPatients(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor patients:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load associated patients');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPatients]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No previous visit';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-hospital-700 via-hospital-600 to-blue-700 rounded-2xl p-6 text-white shadow-premium">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Queue</span>
            </button>
            <span className="inline-block rounded bg-white/20 text-[10px] font-bold text-white px-2.5 py-1 uppercase backdrop-blur-sm">
              Associated Patients Directory
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight leading-none">
            My Patients Directory
          </h2>
          <p className="text-xs text-blue-100 font-semibold mt-1.5 opacity-90">
            All historical and active patients associated with your consultations, appointments, and care.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 backdrop-blur-sm">
            <Users className="h-5 w-5 text-blue-200" />
            <div>
              <span className="text-[10px] font-bold text-blue-100 block uppercase">Total Associated</span>
              <span className="text-base font-black leading-tight">{patients.length} Patients</span>
            </div>
          </div>
          <button
            onClick={() => fetchPatients(searchTerm)}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
            title="Refresh patient list"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Unable to load patient directory</h3>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchPatients(searchTerm)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, ID, phone number, or diagnosis..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-hospital-500 focus:ring-1 focus:ring-hospital-500 transition-all bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <span>Clear Search</span>
          </button>
        )}
      </div>

      {/* Patients Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
            Patient Directory ({patients.length})
          </h3>
          <span className="text-[10px] font-bold text-slate-400">
            Click any patient card to view complete EMR history and clinical workspace
          </span>
        </div>

        {isLoading ? (
          <div className="py-8">
            <SkeletonLoader count={6} type="card" />
          </div>
        ) : patients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => {
              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                  className="border border-slate-200 bg-white rounded-2xl p-5 shadow-premium hover:shadow-premium-hover transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] active:scale-[0.99] group border-l-4 border-l-hospital-500 hover:-translate-y-0.5"
                >
                  <div>
                    {/* Header: Name, ID, Gender, Age */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-slate-800 group-hover:text-hospital-600 transition-colors leading-tight truncate">
                          {patient.name}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase tracking-wide">
                          ID: {patient.patientCode || 'N/A'} &bull; {patient.gender || 'Patient'} &bull; {patient.age ?? 'N/A'} Yrs
                        </span>
                      </div>
                      {patient.bloodGroup && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                          {patient.bloodGroup}
                        </span>
                      )}
                    </div>

                    {/* Primary Diagnosis Box */}
                    <div className="mt-3 border border-sky-100/70 bg-sky-50/50 rounded-xl p-3 shadow-inner">
                      <span className="text-[8px] font-black uppercase tracking-wider block text-sky-600">
                        Primary Diagnosis / Condition
                      </span>
                      <p className="text-xs font-extrabold text-slate-700 line-clamp-2 mt-0.5 leading-snug">
                        {patient.primaryDiagnosis || 'Orthopedic Consultation'}
                      </p>
                    </div>

                    {/* Phone details if available */}
                    {patient.phone && (
                      <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Last Visit & Action Link */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Last Visit: {formatDate(patient.lastVisit || patient.lastVisitDate)}</span>
                    </div>
                    <span className="text-[10px] font-black text-hospital-600 group-hover:underline">
                      Open EMR &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={searchTerm ? 'No Matching Patients' : 'No Patients Assigned'}
            message={
              searchTerm
                ? `No patients match "${searchTerm}". Try checking the name, ID, phone number or diagnosis.`
                : 'You currently have no historical or active patients associated with your workstation.'
            }
          />
        )}
      </div>
    </div>
  );
};

export default MyPatients;

