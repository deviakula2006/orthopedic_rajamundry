import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHospital } from '../../context/HospitalContext';
import {
  Users,
  Calendar,
  IndianRupee,
  Activity,
  Bed,
  ArrowUpRight,
  TrendingUp,
  Stethoscope,
  Receipt,
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import orthoIll from '../../assets/ortho_ill.png';

// Modals
import PatientModal from '../../components/modals/PatientModal';
import AppointmentModal from '../../components/modals/AppointmentModal';
import InvestigationModal from '../../components/modals/InvestigationModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const {
    patients,
    appointments,
    bills,
    beds,
    activities,
    doctors,
    receptionists,
    addPatient,
    dashboardSummary
  } = useHospital();
  
  const navigate = useNavigate();

  // Modal states
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [investigationModalOpen, setInvestigationModalOpen] = useState(false);

  const handleSavePatient = (patientData) => {
    addPatient(patientData);
  };

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981'];

  const stats = useMemo(() => {
    if (!dashboardSummary) return [];
    return [
      {
        title: 'Total Patients',
        value: dashboardSummary.totalPatients,
        change: '+10%',
        isPositive: true,
        timeframe: 'from last month',
        icon: Users,
        color: 'from-blue-500 to-indigo-500',
        bgLight: 'bg-blue-50'
      },
      {
        title: "Today's Appointments",
        value: dashboardSummary.appointmentsToday,
        change: '+5%',
        isPositive: true,
        timeframe: 'from last week',
        icon: Calendar,
        color: 'from-hospital-500 to-cyanic-400',
        bgLight: 'bg-sky-50'
      },
      {
        title: "Today's Revenue",
        value: new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(dashboardSummary.revenueToday),
        change: '+12%',
        isPositive: true,
        timeframe: 'from yesterday',
        icon: IndianRupee,
        color: 'from-emerald-500 to-teal-500',
        bgLight: 'bg-emerald-50'
      },
      {
        title: "Today's Investigations",
        value: dashboardSummary.todayInvestigations,
        change: '+8%',
        isPositive: true,
        timeframe: 'tests executed',
        icon: Activity,
        color: 'from-purple-500 to-indigo-500',
        bgLight: 'bg-purple-50'
      }
    ];
  }, [dashboardSummary]);

  // Directory counts
  const activeDoctorsCount = dashboardSummary?.activeDoctors ?? 0;
  const activeReceptionistsCount = dashboardSummary?.activeReceptionists ?? 0;
  const totalBedsCount = dashboardSummary?.beds?.total ?? 0;
  const availableBedsCount = dashboardSummary?.beds?.available ?? 0;

  // Chart Data: dynamic trend based on last 7 days of actual appointments and revenue
  const trendData = dashboardSummary?.appointmentsTrend ?? [];

  // Donut Chart: dynamic revenue breakdown from bills
  const pieData = useMemo(() => {
    if (!dashboardSummary) return [];
    return dashboardSummary.revenueOverview.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length]
    }));
  }, [dashboardSummary]);

  if (!dashboardSummary) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">Loading hospital dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-hospital-600 via-hospital-500 to-cyanic-500 p-6 md:p-8 text-white shadow-premium"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm mb-3">
              Admin Control Center
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Rajahmundry Orthopedic Hospital Management
            </h2>
            <p className="mt-2 text-xs md:text-sm text-slate-100 font-medium leading-relaxed">
              Monitor orthopedics staff availability, schedule joint-replacement consultations, allocate patient wards, and audit billing metrics in real-time.
            </p>
          </div>
          <div className="shrink-0 hidden md:block">
            <img src={orthoIll} alt="Illustration" className="h-28 w-auto object-contain opacity-95" />
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 translate-x-10 pointer-events-none"></div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.title}
                </span>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${stat.color} text-white shadow-premium group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold tracking-tight text-slate-800">
                  {stat.value}
                </span>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {stat.change}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {stat.timeframe}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Area Chart - Appointment Trends */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">OPD Appointments Trend</h3>
              <p className="text-xs text-slate-400 font-semibold">Weekly patient diagnostics load</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-hospital-600 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>This Week</span>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <ChartTooltip />
                <Area type="monotone" dataKey="appointments" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorApt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart - Revenue Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Revenue Overview</h3>
            <p className="text-xs text-slate-400 font-semibold">Monthly income streams breakdown</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-bold text-slate-500">
            {pieData.map((d) => (
              <div key={d.name} className="flex flex-col items-center text-center">
                <span className="h-2 w-2 rounded-full mb-1" style={{ backgroundColor: d.color }}></span>
                <span className="truncate w-full">{d.name}</span>
                <span className="text-slate-800 font-extrabold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Bottom: Recent Activities & Hospital Panel Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium">
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Recent Activities</h3>
            <span className="rounded-full bg-slate-50 border px-2 py-1 text-[10px] font-bold text-slate-400">
              Auto Updates
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {activities.slice(0, 5).map((act) => {
              let Icon = Activity;
              let color = 'text-blue-500 bg-blue-50';
              if (act.type === 'patient') {
                Icon = Users;
                color = 'text-sky-500 bg-sky-50';
              } else if (act.type === 'appointment') {
                Icon = Calendar;
                color = 'text-indigo-500 bg-indigo-50';
              } else if (act.type === 'billing') {
                Icon = Receipt;
                color = 'text-emerald-500 bg-emerald-50';
              } else if (act.type === 'doctor') {
                Icon = Stethoscope;
                color = 'text-violet-500 bg-violet-50';
              } else if (act.type === 'bed') {
                Icon = Bed;
                color = 'text-teal-500 bg-teal-50';
              }

              return (
                <div key={act.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 leading-normal truncate">
                       {act.action}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {act.user} &bull; {act.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Stats Summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Quick Directory Audit</h3>
            <p className="text-xs text-slate-400 font-semibold">Active staff and ward registrations</p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white shadow-premium">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Doctors</span>
                <span className="text-sm font-extrabold text-slate-800">{activeDoctorsCount} Panelists</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-premium">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Reception Staff</span>
                <span className="text-sm font-extrabold text-slate-800">{activeReceptionistsCount} Members</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyanic-500 text-white shadow-premium">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Total Beds</span>
                <span className="text-sm font-extrabold text-slate-800">{totalBedsCount} Allocated</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-premium">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Available Beds</span>
                <span className="text-sm font-extrabold text-slate-800">{availableBedsCount} Vacant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals for Quick Actions */}
      <PatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
        onSave={handleSavePatient}
      />
      
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
      />

      <InvestigationModal
        isOpen={investigationModalOpen}
        onClose={() => setInvestigationModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
