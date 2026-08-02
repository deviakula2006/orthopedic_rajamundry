import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Modals
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';

const ReceptionistDashboard = () => {
  const { patients, appointments, bills, addPatient } = useHospital();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modal States
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

  // Compute Receptionist KPIs
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Total Registrations Today
  const registrationsTodayCount = patients.filter((p) => p.registrationDate === todayStr).length;

  // Total Appointments
  const totalAppointmentsCount = appointments.filter((a) => a.date === todayStr).length;

  // Checked-In Patients (status is Checked In or In Consultation)
  const checkedInCount = appointments.filter(
    (a) => a.date === todayStr && (a.status === 'Checked In' || a.status === 'In Consultation')
  ).length;

  // Pending Appointments (status is Scheduled)
  const pendingAppointmentsCount = appointments.filter(
    (a) => a.date === todayStr && a.status === 'Scheduled'
  ).length;

  // Today's Collection
  const todayBills = bills.filter((b) => b.date === todayStr && b.paymentStatus === 'Paid');
  const todayCollectionVal = todayBills.reduce((acc, b) => acc + b.total, 0);
  const formattedCollection = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(todayCollectionVal || 1850);

  const stats = [
    {
      title: 'Registrations Today',
      value: registrationsTodayCount,
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Total Appointments Today',
      value: totalAppointmentsCount,
      icon: Calendar,
      color: 'from-hospital-500 to-cyanic-400',
      bgLight: 'bg-sky-50'
    },
    {
      title: 'Checked-In Patients',
      value: checkedInCount,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50'
    },
    {
      title: 'Pending Appointments',
      value: pendingAppointmentsCount,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50'
    },
    {
      title: "Today's Collection",
      value: formattedCollection,
      icon: IndianRupee,
      color: 'from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50'
    }
  ];

  // Get today's scheduled appointments list
  const todayAppointments = appointments.filter((a) => a.date === todayStr).slice(0, 5);

  const handleSavePatient = (patientData, bookAppointment = false) => {
    const newPatient = addPatient(patientData);
    if (bookAppointment && newPatient) {
      setAppointmentModalOpen(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-hospital-600 via-hospital-500 to-cyanic-500 p-6 md:p-8 text-white shadow-premium">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm mb-3">
          Front Desk Console
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
          Welcome, {user?.name || 'Laxmi Kumari'}
        </h2>
        <p className="mt-1 text-xs md:text-sm text-slate-100 font-semibold leading-relaxed">
          Manage patient registrations, schedule joint diagnostic checkups, assign recovery wards, and process billing invoices.
        </p>
      </div>

      {/* Quick Actions Panel */}
      

      {/* KPIs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-premium group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {stat.title}
                </span>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr ${stat.color} text-white shadow-premium`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-extrabold tracking-tight text-slate-800">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Appointments List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium">
        <div className="border-b pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Today's Appointment Log</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Active scheduler items for today ({todayStr})</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/receptionist/appointments')}
            className="text-xs font-bold text-hospital-600 hover:text-hospital-700 cursor-pointer"
          >
            View All appointments &rarr;
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {todayAppointments.map((apt) => (
            <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 first:pt-0 last:pb-0 gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800">{apt.patientName}</span>
                <div className="flex gap-2 text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                  <span>ID: {apt.patientId}</span>
                  <span>&bull;</span>
                  <span>Doctor: {apt.doctorName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-center">
                <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border px-2 py-0.5 rounded-lg">
                  {apt.time}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    apt.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : apt.status === 'Checked In'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : apt.status === 'In Consultation'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
          {todayAppointments.length === 0 && (
            <div className="py-6 text-center text-xs font-semibold text-slate-400">
              No appointments scheduled for today.
            </div>
          )}
        </div>
      </div>

      {/* Forms Modals */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSavePatient}
      />

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />
    </div>
  );
};

export default ReceptionistDashboard;
