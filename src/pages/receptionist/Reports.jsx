import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import {
  FileText,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  BarChart,
  Bar
} from 'recharts';

const ReceptionistReports = () => {
  const { patients, appointments, bills } = useHospital();
  const [activeTab, setActiveTab] = useState('registrations');
  const [dateFrom, setDateFrom] = useState('2026-06-21');
  const [dateTo, setDateTo] = useState('2026-06-21');

  // Compute reports datasets
  const todayStr = '2026-06-21';

  // 1. Registrations Report
  const registeredPatients = patients.filter((p) => {
    if (!p.registrationDate) return false;
    return p.registrationDate >= dateFrom && p.registrationDate <= dateTo;
  });

  // 2. Appointments Report
  const appointmentRecords = appointments.filter((a) => {
    return a.date >= dateFrom && a.date <= dateTo;
  });

  // 3. Billing Collections Report
  const billingRecords = bills.filter((b) => {
    return b.date >= dateFrom && b.date <= dateTo;
  });
  const totalCollectionsVal = billingRecords
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((acc, b) => acc + b.total, 0);

  // Trend Data for Charts
  const regTrendData = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 12 },
    { day: 'Fri', count: 8 },
    { day: 'Sat', count: 4 },
    { day: 'Sun', count: 6 }
  ];

  const aptTrendData = [
    { day: 'Mon', count: 15 },
    { day: 'Tue', count: 22 },
    { day: 'Wed', count: 18 },
    { day: 'Thu', count: 28 },
    { day: 'Fri', count: 20 },
    { day: 'Sat', count: 10 },
    { day: 'Sun', count: 5 }
  ];

  const collectionsTrendData = [
    { day: 'Mon', amount: 15000 },
    { day: 'Tue', amount: 22000 },
    { day: 'Wed', amount: 14000 },
    { day: 'Thu', amount: 35000 },
    { day: 'Fri', amount: 28000 },
    { day: 'Sat', amount: 12000 },
    { day: 'Sun', amount: 8000 }
  ];

  const handleExport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}... (Future integration module)`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-600 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>PDF Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-600 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Excel Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-600 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>CSV File</span>
          </button>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-premium flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span>Date From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Date To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setDateFrom(todayStr);
            setDateTo(todayStr);
          }}
          className="rounded-lg bg-slate-100 hover:bg-slate-200 py-1.5 px-3 text-xs font-bold text-slate-700 cursor-pointer"
        >
          Reset to Today
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'registrations'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Patient Registrations
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          OPD Appointments
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Billing Collections
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'registrations' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-hospital-500">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-800">{registeredPatients.length} Patients</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 block mb-2">Registration Weekly Trend</span>
            <div className="h-28 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={regTrendData}>
                  <XAxis dataKey="day" stroke="#cbd5e1" />
                  <ChartTooltip />
                  <Area type="monotone" dataKey="count" stroke="#0ea5e9" fill="#e0f2fe" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="md:col-span-3 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-premium">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                  <th className="px-6 py-3">Patient ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Gender</th>
                  <th className="px-6 py-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {registeredPatients.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-3 text-hospital-600 font-bold">{p.id}</td>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3 text-slate-400">{p.phone}</td>
                    <td className="px-6 py-3">{p.gender}</td>
                    <td className="px-6 py-3 text-slate-400">{p.registrationDate || todayStr}</td>
                  </tr>
                ))}
                {registeredPatients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                      No registrations found in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Appointments</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-hospital-500">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-800">{appointmentRecords.length} Consultations</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 block mb-2">OPD Appointment Trends</span>
            <div className="h-28 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aptTrendData}>
                  <XAxis dataKey="day" stroke="#cbd5e1" />
                  <ChartTooltip />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="md:col-span-3 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-premium">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                  <th className="px-6 py-3">Appt ID</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Doctor Consultant</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {appointmentRecords.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-3 text-hospital-600 font-bold">{a.id}</td>
                    <td className="px-6 py-3">{a.patientName}</td>
                    <td className="px-6 py-3 text-slate-500">{a.doctorName}</td>
                    <td className="px-6 py-3">{a.type}</td>
                    <td className="px-6 py-3">
                      <span className="rounded bg-slate-50 border px-2 py-0.5 text-[10px] font-extrabold uppercase">
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-400">{a.date}</td>
                  </tr>
                ))}
                {appointmentRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      No appointments recorded in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Summary Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Collection</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-800">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalCollectionsVal)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 block mb-2">Collection Weekly Trend</span>
            <div className="h-28 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={collectionsTrendData}>
                  <XAxis dataKey="day" stroke="#cbd5e1" />
                  <ChartTooltip />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#ecfdf5" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="md:col-span-3 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-premium">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                  <th className="px-6 py-3">Invoice No</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Payment Mode</th>
                  <th className="px-6 py-3 text-right">Discount (₹)</th>
                  <th className="px-6 py-3 text-right">Tax (₹)</th>
                  <th className="px-6 py-3 text-right">Total Collection (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {billingRecords.map((b) => (
                  <tr key={b.invoiceNo}>
                    <td className="px-6 py-3 text-hospital-600 font-bold">{b.invoiceNo}</td>
                    <td className="px-6 py-3">{b.patientName}</td>
                    <td className="px-6 py-3 text-slate-400">{b.paymentMode}</td>
                    <td className="px-6 py-3 text-right text-red-500">-₹{b.discount}</td>
                    <td className="px-6 py-3 text-right">₹{b.tax}</td>
                    <td className="px-6 py-3 text-right font-extrabold text-slate-800">₹{b.total}</td>
                  </tr>
                ))}
                {billingRecords.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                      No invoices recorded in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistReports;
