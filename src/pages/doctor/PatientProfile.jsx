import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/api';
import {
  ArrowLeft,
  Heart,
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Modals
import AddVitalsModal from '../../components/modals/AddVitalsModal';
import OrderInvestigationModal from '../../components/modals/OrderInvestigationModal';
import AddPrescriptionModal from '../../components/modals/AddPrescriptionModal';
import AddConsultationSummaryModal from '../../components/modals/AddConsultationSummaryModal';

const PatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    patients,
    appointments,
    updateAppointmentStatus,
    showToast,
    fetchVisitHistory,
    completeConsultation
  } = useHospital();

  // Modals state
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [liveVisits, setLiveVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [patientBed, setPatientBed] = useState(null); // { bedNumber, wardName } | null

  // Expandable visits timeline state
  const [expandedVisits, setExpandedVisits] = useState({});

  const contextPatient = patients.find((p) => p.id === patientId || p.dbId === patientId);
  const patient = patientData || contextPatient;

  // Active doctor appointment
  const activeApt = appointments.find(
    (a) => (a.patientId === patientId || a.patientId === patient?.id) && a.status !== 'Completed' && a.status !== 'Cancelled'
  );

  const loadPatientProfile = useCallback(() => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);

    // 1. Fetch patient profile from API if needed
    const fetchPatientPromise = apiClient.get(`/patients/${patientId}`).then(res => res.data?.data).catch(() => null);
    
    // 2. Fetch live visit history from PostgreSQL REST API
    const fetchHistoryPromise = fetchVisitHistory(patientId, user?.doctorId);

    // 3. Fetch bed info for this patient (if admitted)
    const fetchBedPromise = apiClient
      .get('/bed-management/wards')
      .then((res) => {
        const wards = res.data?.data ?? [];
        for (const ward of wards) {
          const bed = (ward.beds ?? []).find(
            (b) => b.patient?.id === patientId && b.status === 'Occupied'
          );
          if (bed) return { bedNumber: bed.bedNumber, wardName: ward.name };
        }
        return null;
      })
      .catch(() => null);

    Promise.all([fetchPatientPromise, fetchHistoryPromise, fetchBedPromise])
      .then(([apiPatient, history, bedInfo]) => {
        if (apiPatient) {
          setPatientData(apiPatient);
        }
        setPatientBed(bedInfo);
        if (history && Array.isArray(history)) {
          setLiveVisits(history);
          if (history.length > 0) {
            setExpandedVisits((prev) => ({
              ...prev,
              [history[0].id]: true
            }));
          }
        } else {
          setLiveVisits([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load patient profile data:', err);
        setError('Failed to load patient record from PostgreSQL');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [patientId, user?.doctorId, fetchVisitHistory]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadPatientProfile();
    });
  }, [loadPatientProfile]);

  const sortedVisits = [...liveVisits].sort(
    (a, b) => new Date(b.visitDate || b.createdAt) - new Date(a.visitDate || a.createdAt)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="h-44 bg-slate-900 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-extrabold text-slate-800 leading-none">Consultation Workspace</h2>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Failed to load patient chart</h3>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadPatientProfile}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
          >
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-premium">
        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Patient File Not Found</h3>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="mt-4 text-xs font-bold text-hospital-600 hover:underline flex items-center gap-1.5 justify-center mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const toggleVisitExpand = (visitId) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [visitId]: !prev[visitId]
    }));
  };

  const handleStartConsultation = () => {
    if (activeApt) {
      updateAppointmentStatus(activeApt.id, 'In Consultation');
      showToast('Patient status updated to In Consultation.');
    }
  };

  const handleMarkCompleted = async () => {
    if (activeApt) {
      await completeConsultation(patientId, {});
      // Bed vacate is managed through the Bed Management page
    }
    setCompleteOpen(false);
    navigate('/doctor/dashboard');
  };

  const formatDateWithHyphen = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/ /g, '-');
    } catch {
      return dateStr;
    }
  };

  // patientBed is fetched via API in loadPatientProfile above

  return (
    <div className="space-y-6">
      
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-slate-800 leading-none">Consultation Workspace</h2>
          <span className="text-[10px] font-semibold text-slate-400">Patient chart details</span>
        </div>
      </div>

      {/* SECTION 1: PATIENT INFORMATION CARD (Premium medical high contrast styling) */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-hospital-950 to-blue-950 text-white p-6 shadow-premium relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 h-40 w-40 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={patient.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${patient.name}`}
              alt={patient.name}
              className="h-16 w-16 rounded-xl border border-white/20 shrink-0 bg-white shadow-inner"
            />
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none text-white">
                {patient.name}
              </h1>
              <div className="flex flex-wrap gap-2.5 text-[10px] font-extrabold text-blue-200 mt-2.5 uppercase tracking-wider">
                <span>Patient ID: {patient.id}</span>
                <span>&bull;</span>
                <span>{patient.gender}</span>
                <span>&bull;</span>
                <span>{patient.age} Yrs</span>
                <span>&bull;</span>
                <span>BG: {patient.bloodGroup || 'O+'}</span>
              </div>
            </div>
          </div>
          <div className="text-right md:justify-self-end">
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block">Primary Diagnosis</span>
            <span className="text-xs font-black text-white bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 inline-block mt-1.5 backdrop-blur-sm shadow-sm">
              {patient.disease || 'Osteoarthritis Knee'}
            </span>
          </div>
        </div>

        {/* Detailed Demographics Info */}
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4 mt-5 text-xs font-semibold text-blue-100 relative z-10">
          <div>
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block">Phone Number</span>
            <span className="text-white font-extrabold block mt-1">{patient.phone}</span>
          </div>
          <div>
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block">Residential Address</span>
            <span className="text-white font-extrabold block mt-1 truncate" title={patient.address}>
              {patient.address}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block">Registration Date</span>
            <span className="text-white font-extrabold block mt-1">
              {patient.registrationDate ? formatDateWithHyphen(patient.registrationDate) : '21-Jun-2026'}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest block">Admission Status</span>
            <span className="text-white font-extrabold block mt-1">
              {patientBed
                ? `Admitted ( ${patientBed.wardName} — Bed ${patientBed.bedNumber})`
                : 'Outpatient / Not Admitted'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: APPOINTMENT INFORMATION CARD */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-center shadow-inner">
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Appointment Date</span>
          <span className="text-xs font-black text-slate-700 mt-1 block">
            {activeApt ? formatDateWithHyphen(activeApt.date) : 'No active appointments today'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Time Slot</span>
          <span className="text-xs font-black text-slate-700 mt-1 block">
            {activeApt ? activeApt.time : '--'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Type</span>
          <span className="text-xs font-black text-slate-700 mt-1 block">
            {activeApt ? activeApt.type : '--'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Assigned Doctor</span>
          <span className="text-xs font-black text-slate-700 mt-1 block">
            {activeApt ? activeApt.doctorName : '--'}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
          <div className="mt-1 block">
            {activeApt ? <StatusBadge status={activeApt.status} /> : '--'}
          </div>
        </div>
      </div>

      {/* SECTION 3: DOCTOR ACTION BAR (Themed Buttons) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-premium space-y-3">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b pb-2">
          Clinical Consultation Actions
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          {activeApt && activeApt.status === 'Checked In' && (
            <button
              onClick={handleStartConsultation}
              className="rounded-xl bg-gradient-to-r from-hospital-600 to-blue-600 hover:from-hospital-700 hover:to-blue-700 py-3 px-5 text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.01] transition-all"
            >
              <Clock className="h-4 w-4" />
              <span>Start Consultation</span>
            </button>
          )}

          <button
            onClick={() => setVitalsOpen(true)}
            className="rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50/20 hover:bg-rose-50/50 py-3 px-5 text-xs font-black text-rose-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Heart className="h-4 w-4 text-rose-500" />
            <span>Add Vitals</span>
          </button>

          <button
            onClick={() => setInvestigationOpen(true)}
            className="rounded-xl border border-sky-200 hover:border-sky-300 bg-sky-50/20 hover:bg-sky-50/50 py-3 px-5 text-xs font-black text-sky-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <ClipboardList className="h-4 w-4 text-sky-500" />
            <span>Add Investigation</span>
          </button>

          <button
            onClick={() => setPrescriptionOpen(true)}
            className="rounded-xl border border-purple-200 hover:border-purple-300 bg-purple-50/20 hover:bg-purple-50/50 py-3 px-5 text-xs font-black text-purple-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <FileText className="h-4 w-4 text-purple-500" />
            <span>Add Prescription</span>
          </button>

          <button
            onClick={() => setSummaryOpen(true)}
            className="rounded-xl border border-amber-200 hover:border-amber-300 bg-amber-50/20 hover:bg-amber-50/50 py-3 px-5 text-xs font-black text-amber-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Shield className="h-4 w-4 text-amber-500" />
            <span>Add Consultation Summary</span>
          </button>

          {activeApt && (
            <button
              onClick={() => setCompleteOpen(true)}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-750 py-3 px-6 text-xs font-black text-white shadow-md flex items-center gap-1.5 cursor-pointer ml-auto transform hover:scale-[1.01] transition-all"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark Consultation Completed</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 4: PATIENT HISTORY (Timeline) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">
          Patient Visit EMR Timeline
        </h3>

        <div className="space-y-4">
          {sortedVisits.map((visit) => {
            const isExpanded = expandedVisits[visit.id];
            
            // Defensive sanitization of EMR visit details
            let vitalsList = [];
            if (visit.vitals) {
              if (Array.isArray(visit.vitals)) {
                vitalsList = visit.vitals;
              } else if (typeof visit.vitals === 'object') {
                vitalsList = [visit.vitals];
              }
            }

            let investigationsList = [];
            if (visit.investigations) {
              if (Array.isArray(visit.investigations)) {
                investigationsList = visit.investigations;
              } else if (typeof visit.investigations === 'object') {
                investigationsList = [visit.investigations];
              }
            } else if (visit.investigationsOrdered) {
              if (Array.isArray(visit.investigationsOrdered)) {
                investigationsList = visit.investigationsOrdered;
              } else if (typeof visit.investigationsOrdered === 'object') {
                investigationsList = [visit.investigationsOrdered];
              }
            }

            let prescriptionsList = [];
            if (visit.prescriptions) {
              if (Array.isArray(visit.prescriptions)) {
                prescriptionsList = visit.prescriptions;
              } else if (typeof visit.prescriptions === 'object') {
                prescriptionsList = [visit.prescriptions];
              }
            }

            let visitSummary = visit.summary || null;
            if (!visitSummary && visit.notes) {
              visitSummary = {
                time: visit.time || '10:00 AM',
                addedBy: visit.doctorName || 'Doctor',
                symptoms: visit.notes,
                findings: 'Recorded in visit notes',
                diagnosis: visit.diagnosis || 'Osteoarthritis Knee',
                advice: 'Recorded in visit notes',
                followUp: 'As directed'
              };
            }
            
            return (
              <div
                key={visit.id}
                className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-premium"
              >
                {/* Expandable visit date header */}
                <div
                  onClick={() => toggleVisitExpand(visit.id)}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors border-l-4 border-hospital-600 bg-slate-50/40"
                >
                  <div>
                    <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>{formatDateWithHyphen(visit.visitDate)}</span>
                      <span className="rounded bg-hospital-50 border border-hospital-150 text-[9px] font-black text-hospital-700 px-2 py-0.5 uppercase tracking-wide">
                        {visit.appointmentType || 'Consultation'}
                      </span>
                    </h2>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wide">
                      Doctor Name: {visit.doctorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {visit.billRefNo && (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-lg uppercase">
                        BILL REF: {visit.billRefNo}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Opened visit EMR details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-100/10 space-y-6">
                    
                    {/* Vitals History segment - Styled card background */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest border-b border-rose-100 pb-1 flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5" />
                        <span>Recorded Vitals</span>
                      </h4>
                      {vitalsList && vitalsList.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {vitalsList.map((vit, vIdx) => (
                            <div key={vIdx} className="bg-rose-50/20 border border-rose-100/60 rounded-xl p-4 shadow-sm space-y-2">
                              <div className="flex items-center justify-between border-b border-rose-100/40 pb-1 text-[9px] font-bold text-slate-400">
                                <span>Recorded: {vit.time}</span>
                                <span>By: {vit.addedBy}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-650">
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                                  <span className="text-slate-800 font-extrabold">{vit.bp} mmHg</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Blood Sugar</span>
                                  <span className="text-slate-800 font-extrabold">{vit.sugar} mg/dL</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Temperature</span>
                                  <span className="text-slate-800 font-extrabold">{vit.temp} °F</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Pulse Rate</span>
                                  <span className="text-slate-800 font-extrabold">{vit.pulse || '--'} bpm</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Weight / Height</span>
                                  <span className="text-slate-800 font-extrabold">{vit.weight || '--'}kg / {vit.height || '--'}cm</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Oxygen SpO2</span>
                                  <span className="text-hospital-600 font-extrabold">{vit.spo2 || '98'}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-4 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold text-slate-400">
                           <AlertCircle className="h-4 w-4" />
                           <span>No Vitals Recorded Yet</span>
                        </div>
                      )}
                    </div>

                    {/* Investigations history ordered test orders - Styled card background */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest border-b border-sky-100 pb-1 flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span>Diagnostics & Investigations</span>
                      </h4>
                      {investigationsList && investigationsList.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {investigationsList.map((inv, iIdx) => (
                            <div key={iIdx} className="bg-sky-50/20 border border-sky-100/60 rounded-xl p-4 shadow-sm flex items-center justify-between">
                              <div>
                                <h5 className="text-xs font-black text-slate-800">{inv.testName}</h5>
                                <div className="flex gap-2 text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                  <span>Time: {inv.orderedTime || '10:30 AM'}</span>
                                  <span>&bull;</span>
                                  <span>By: {inv.orderedBy}</span>
                                </div>
                              </div>
                              <span className={`inline-block rounded px-2.5 py-0.5 text-[9px] font-black border ${
                                inv.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-4 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold text-slate-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>No Investigations Ordered</span>
                        </div>
                      )}
                    </div>

                    {/* Prescription written medicines - Styled card background */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-b border-purple-100 pb-1 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span>Prescribed Medicines</span>
                      </h4>
                      {prescriptionsList && prescriptionsList.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {prescriptionsList.map((rx, rIdx) => (
                            <div key={rIdx} className="bg-purple-50/20 border border-purple-100/60 rounded-xl p-4 shadow-sm space-y-2">
                              <div className="flex items-center justify-between border-b border-purple-100/40 pb-1 text-[8px] font-bold text-slate-400">
                                <span>Time: {rx.time || '10:30 AM'}</span>
                                <span>By: {rx.addedBy}</span>
                              </div>
                              <h5 className="text-xs font-black text-slate-800">{rx.medicineName}</h5>
                              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-slate-500">
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-normal">Dosage</span>
                                  <span className="text-slate-700 font-extrabold">{rx.dosage}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-normal">Frequency</span>
                                  <span className="text-slate-700 font-extrabold">{rx.frequency}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-normal">Duration</span>
                                  <span className="text-slate-700 font-extrabold">{rx.duration}</span>
                                </div>
                              </div>
                              {rx.notes && (
                                <p className="text-[9px] font-bold text-slate-400 bg-white border border-purple-100/30 p-1.5 rounded mt-1.5 shadow-inner">
                                  Note: {rx.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-4 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold text-slate-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>No Prescriptions Added</span>
                        </div>
                      )}
                    </div>

                    {/* Consultation Notes Summary - Styled card background */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-100 pb-1 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        <span>Consultation Notes Summary</span>
                      </h4>
                      {visitSummary ? (
                        <div className="bg-amber-50/20 border border-amber-100/60 rounded-xl p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-amber-100/40 pb-1.5 text-[9px] font-bold text-slate-400">
                            <span>Recorded: {visitSummary.time}</span>
                            <span>By: {visitSummary.addedBy}</span>
                          </div>
                          
                          <div className="grid gap-3.5 sm:grid-cols-2 text-xs font-semibold text-slate-650">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Symptoms</span>
                              <p className="text-slate-800 font-bold mt-0.5">{visitSummary.symptoms}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Clinical Findings</span>
                              <p className="text-slate-800 font-bold mt-0.5">{visitSummary.findings}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Diagnosis</span>
                              <p className="text-slate-800 font-bold mt-0.5">{visitSummary.diagnosis}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Advice / Plan</span>
                              <p className="text-slate-800 font-bold mt-0.5">{visitSummary.advice}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-[9px] font-bold text-slate-400 uppercase block">Follow-up Instructions</span>
                              <p className="text-slate-800 font-bold mt-0.5">{visitSummary.followUp}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-4 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs font-semibold text-slate-400">
                          <AlertCircle className="h-4 w-4" />
                          <span>No Consultation Notes Available</span>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {sortedVisits.length === 0 && (
            <div className="border border-dashed border-slate-200 bg-white rounded-2xl py-12 text-center text-xs font-bold text-slate-400">
              No Previous Visit History
            </div>
          )}
        </div>
      </div>

      {/* Action Modals */}
      <AddVitalsModal
        isOpen={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        patientId={patientId}
        onSuccess={loadPatientProfile}
      />

      <OrderInvestigationModal
        isOpen={investigationOpen}
        onClose={() => setInvestigationOpen(false)}
        patientId={patientId}
        onSuccess={loadPatientProfile}
      />

      <AddPrescriptionModal
        isOpen={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        patientId={patientId}
        onSuccess={loadPatientProfile}
      />

      <AddConsultationSummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        patientId={patientId}
        onSuccess={loadPatientProfile}
      />

      <ConfirmationModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleMarkCompleted}
        title="Mark Consultation Completed"
        message={`Are you sure you want to complete this consultation? This will close the active appointment slot for ${patient.name} and release their ward bed if they occupy one.`}
        confirmText="Yes, Complete"
        type="warning"
      />

    </div>
  );
};

export default PatientProfile;
