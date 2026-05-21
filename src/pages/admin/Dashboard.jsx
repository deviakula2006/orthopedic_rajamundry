import React from 'react';
import { motion } from 'framer-motion';
import { useHospital } from '../../context/HospitalContext';
import {
  Users,
  Calendar,
  IndianRupee,
  Bed,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Stethoscope,
  Activity,
  Receipt
} from 'lucide-react';
import orthoIll from '../../assets/ortho_ill.png';

const Dashboard = () => {
  const { patients, appointments, bills, beds, activities } = useHospital();

  // Compute stats dynamically from state
  const patientCount = patients.length;
  const appointmentCount = appointments.length;

  const totalRevenue = bills.reduce((acc, b) => acc + b.total, 0);
  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(totalRevenue || 1245300);

  const availableBeds = beds.filter((b) => b.status === 'Available').length;

  const stats = [
    {
      title: 'Total Patients',
      value: patientCount + 1238, // base + dynamic
      change: '+12%',
      isPositive: true,
      timeframe: 'from last month',
      icon: Users,
      color: 'from-blue-500 to-indigo-500',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Appointments',
      value: appointmentCount + 323, // base + dynamic
      change: '+8%',
      isPositive: true,
      timeframe: 'from last week',
      icon: Calendar,
      color: 'from-hospital-500 to-cyanic-400',
      bgLight: 'bg-sky-50'
    },
    {
      title: "Today's Revenue",
      value: formattedRevenue,
      change: '+15%',
      isPositive: true,
      timeframe: 'from yesterday',
      icon: IndianRupee,
      color: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50'
    },
    {
      title: 'Available Beds',
      value: `${availableBeds} / ${beds.length}`,
      change: '-2',
      isPositive: false,
      timeframe: 'occupied today',
      icon: Bed,
      color: 'from-cyanic-500 to-teal-400',
      bgLight: 'bg-cyan-50'
    }
  ];

  // SVG Chart constants
  const lineChartPoints = "30,120 70,80 110,130 150,70 190,110 230,50 270,90 310,40 350,80 390,30 430,70 470,20";
  const areaChartPoints = "30,120 70,80 110,130 150,70 190,110 230,50 270,90 310,40 350,80 390,30 430,70 470,20 470,150 30,150";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-hospital-600 via-hospital-500 to-cyanic-500 p-8 text-white shadow-premium"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm mb-3">
              Admin Control Center
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Rajahmundry Orthopedic Hospital Management
            </h2>
            <p className="mt-2 text-sm text-slate-100 font-medium leading-relaxed">
              Monitor orthopedics staff availability, schedule joint-replacement consultations, allocate patient wards, and audit billing metrics in real-time.
            </p>
          </div>
          <div className="shrink-0 hidden md:block">
            <img src={orthoIll} alt="Illustration" className="h-32 w-auto object-contain opacity-90" />
          </div>
        </div>
        {/* Decorative subtle background graphics */}
        <div className="absolute top-0 right-0 h-full w-1/3 bg-white/5 skew-x-12 translate-x-10 pointer-events-none"></div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium hover:shadow-premium-hover transition-all group cursor-pointer"
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
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold ${
                      stat.isPositive ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {stat.isPositive ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
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

      {/* Graphs/Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line Chart - OPD Appointments */}
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

          <div className="relative h-64 w-full">
            <svg viewBox="0 0 500 160" className="h-full w-full overflow-visible">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="52.5" x2="470" y2="52.5" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="85" x2="470" y2="85" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="117.5" x2="470" y2="117.5" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="150" x2="470" y2="150" stroke="#e2e8f0" strokeWidth="1" />

              {/* Area Gradient */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <polygon points={areaChartPoints} fill="url(#chartGradient)" />

              {/* Trend Path */}
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={lineChartPoints}
              />

              {/* Grid labels */}
              <text x="12" y="24" className="text-[9px] font-bold fill-slate-400">100</text>
              <text x="12" y="89" className="text-[9px] font-bold fill-slate-400">50</text>
              <text x="12" y="154" className="text-[9px] font-bold fill-slate-400">0</text>

              <text x="30" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Mon</text>
              <text x="110" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Wed</text>
              <text x="190" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Fri</text>
              <text x="270" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Sun</text>
              <text x="350" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Tue</text>
              <text x="430" y="172" className="text-[10px] font-bold fill-slate-400 text-center">Thu</text>

              {/* Interactive Dots */}
              <circle cx="30" cy="120" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
              <circle cx="150" cy="70" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
              <circle cx="230" cy="50" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
              <circle cx="310" cy="40" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
              <circle cx="390" cy="30" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
              <circle cx="470" cy="20" r="5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Donut Chart - Revenue Breakdown */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-800">Revenue Overview</h3>
            <p className="text-xs text-slate-400 font-semibold">Monthly income streams breakdown</p>
          </div>

          <div className="relative flex items-center justify-center h-44 w-full">
            <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
              {/* Background circle */}
              <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />

              {/* OPD segment - 42% (stroke-dasharray="42 100") */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke="#0ea5e9"
                strokeWidth="12"
                strokeDasharray="92.3 220"
                strokeDashoffset="0"
              />

              {/* IPD segment - 33% (stroke-dashoffset="-92.3") */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray="72.5 220"
                strokeDashoffset="-92.3"
              />

              {/* Pharmacy - 15% (stroke-dashoffset="-164.8") */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray="33 220"
                strokeDashoffset="-164.8"
              />

              {/* Investigations - 10% (stroke-dashoffset="-197.8") */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="12"
                strokeDasharray="22 220"
                strokeDashoffset="-197.8"
              />
            </svg>

            {/* Total value text in the center */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400">Total</span>
              <span className="text-base font-extrabold text-slate-800">₹12.45L</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-hospital-500"></span>
              <span className="truncate">OPD - 42%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="truncate">IPD - 33%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="truncate">Pharmacy - 15%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              <span className="truncate">Tests - 10%</span>
            </div>
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
            {activities.map((act) => {
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
                <span className="text-xl font-extrabold text-slate-800">18 Panelists</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-premium">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Reception Staff</span>
                <span className="text-xl font-extrabold text-slate-800">8 Members</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyanic-500 text-white shadow-premium">
                <Bed className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Total Beds</span>
                <span className="text-xl font-extrabold text-slate-800">24 Allocated</span>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-premium">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block leading-none">Paid Bills</span>
                <span className="text-xl font-extrabold text-slate-800">98% Success</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
