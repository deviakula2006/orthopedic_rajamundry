import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useHospital } from '../../context/HospitalContext';
import { TrendingUp, Download } from 'lucide-react';

const Reports = () => {
  const { bills, patients, investigations, hospitalSettings, showToast } = useHospital();
  const [reportType, setReportType] = useState('Revenue');
  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-31');

  // SVG Chart constants
  const revenuePoints = "30,130 90,110 150,120 210,80 270,95 330,60 390,70 450,30";
  const revenueArea = "30,130 90,110 150,120 210,80 270,95 330,60 390,70 450,30 450,150 30,150";

  // Investigations are a catalog, not a dated transaction — the date range
  // only meaningfully filters Revenue (bill date) and Patients (last visit).
  const filteredBills = useMemo(
    () => bills.filter((b) => b.date >= dateFrom && b.date <= dateTo),
    [bills, dateFrom, dateTo]
  );
  const filteredPatients = useMemo(
    () => patients.filter((p) => p.lastVisitRaw >= dateFrom && p.lastVisitRaw <= dateTo),
    [patients, dateFrom, dateTo]
  );

  const handleGenerateReport = () => {
    const count =
      reportType === 'Revenue' ? filteredBills.length : reportType === 'Patients' ? filteredPatients.length : investigations.length;
    showToast(`Report refreshed — ${count} record${count === 1 ? '' : 's'} in range.`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    const hospitalName = hospitalSettings?.name || 'Rajahmundry Orthopedic Hospital';

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(hospitalName, 14, 18);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`${reportType} Report`, 14, 26);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Range: ${dateFrom} to ${dateTo}  |  Generated: ${new Date().toISOString().slice(0, 10)}`, 14, 32);

    let head;
    let body;
    let fileSuffix;

    if (reportType === 'Revenue') {
      head = [['Invoice ID', 'Patient Name', 'Consultant', 'Sub Total', 'Tax (5%)', 'Grand Total']];
      body = filteredBills.map((b) => [b.invoiceNo, b.patientName, b.doctorName, `Rs.${b.subTotal}`, `Rs.${b.tax}`, `Rs.${b.total}`]);
      fileSuffix = 'revenue';
    } else if (reportType === 'Patients') {
      head = [['Patient ID', 'Full Name', 'Age/Gender', 'Blood Group', 'Phone', 'Last Visit']];
      body = filteredPatients.map((p) => [p.id, p.name, `${p.age} / ${p.gender}`, p.bloodGroup || 'O+', p.phone, p.lastVisit]);
      fileSuffix = 'patients';
    } else {
      head = [['Test Code', 'Test Name', 'Category', 'Price']];
      body = investigations.map((i) => [i.id, i.testName, i.category, `Rs.${i.price}`]);
      fileSuffix = 'investigations';
    }

    autoTable(doc, {
      head,
      body,
      startY: 38,
      headStyles: { fillColor: [14, 165, 233] },
      styles: { fontSize: 9 }
    });

    doc.save(`roh-${fileSuffix}-report-${dateFrom}-to-${dateTo}.pdf`);
    showToast('PDF export generated successfully!');
  };

  const renderReportTable = () => {
    if (reportType === 'Revenue') {
      return (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-premium">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Consultant</th>
                <th className="px-6 py-4">Sub Total</th>
                <th className="px-6 py-4">Tax (5%)</th>
                <th className="px-6 py-4">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredBills.map((b) => (
                <tr key={b.invoiceNo}>
                  <td className="px-6 py-4 text-hospital-600 font-bold">{b.invoiceNo}</td>
                  <td className="px-6 py-4">{b.patientName}</td>
                  <td className="px-6 py-4">{b.doctorName}</td>
                  <td className="px-6 py-4">₹{b.subTotal}</td>
                  <td className="px-6 py-4">₹{b.tax}</td>
                  <td className="px-6 py-4 text-slate-900 font-extrabold">₹{b.total}</td>
                </tr>
              ))}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">No invoices in this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportType === 'Patients') {
      return (
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-premium">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Age / Gender</th>
                <th className="px-6 py-4">Blood Group</th>
                <th className="px-6 py-4">Contact Phone</th>
                <th className="px-6 py-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-hospital-600 font-bold">{p.id}</td>
                  <td className="px-6 py-4">{p.name}</td>
                  <td className="px-6 py-4">{p.age} yrs / {p.gender}</td>
                  <td className="px-6 py-4">
                    <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 font-bold">
                      {p.bloodGroup || 'O+'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{p.phone}</td>
                  <td className="px-6 py-4 text-slate-400">{p.lastVisit}</td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">No patients last visited in this date range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    // Investigations
    return (
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-premium">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
              <th className="px-6 py-4">Test Code</th>
              <th className="px-6 py-4">Test Profile Name</th>
              <th className="px-6 py-4">Lab Category</th>
              <th className="px-6 py-4">Price rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {investigations.map((i) => (
              <tr key={i.id}>
                <td className="px-6 py-4 text-hospital-600 font-bold">{i.id}</td>
                <td className="px-6 py-4">{i.testName}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-50 border px-2 py-0.5 rounded text-slate-500">
                    {i.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-900 font-extrabold">₹{i.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-400 font-semibold">Generate printable PDF ledger lists, patient registrations, and diagnostic statistics</p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-1.5 self-start rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-900 shadow-premium transition-all focus:outline-none"
        >
          <Download className="h-4 w-4" />
          <span>Export PDF Ledger</span>
        </button>
      </div>

      {/* Date Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-premium flex flex-wrap items-end gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div>
          <label className="block mb-1.5">Scope Category</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 font-semibold focus:outline-none"
          >
            <option value="Revenue">Revenue Accounts</option>
            <option value="Patients">Patients Registries</option>
            <option value="Investigations">Investigations Rates</option>
          </select>
        </div>

        <div>
          <label className="block mb-1.5">Date Range From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            disabled={reportType === 'Investigations'}
            className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block mb-1.5">Date Range To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            disabled={reportType === 'Investigations'}
            className="w-44 rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          onClick={handleGenerateReport}
          className="px-6 py-2.5 rounded-xl bg-hospital-500 hover:bg-hospital-600 text-sm font-bold text-white shadow-premium uppercase tracking-normal"
        >
          Generate Report
        </button>
      </div>

      {/* Analytics SVG Graph Block */}
      {reportType === 'Revenue' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-premium">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Monthly Revenue Account Ledger</h3>
              <p className="text-xs text-slate-400 font-semibold">Weekly hospital invoice growth audits</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>₹{filteredBills.reduce((sum, b) => sum + b.total, 0).toLocaleString('en-IN')} in range</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <svg viewBox="0 0 500 160" className="h-full w-full overflow-visible">
              <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="63.3" x2="470" y2="63.3" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="106.6" x2="470" y2="106.6" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="150" x2="470" y2="150" stroke="#e2e8f0" strokeWidth="1" />

              <defs>
                <linearGradient id="repGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              <polygon points={revenueArea} fill="url(#repGradient)" />
              <polyline fill="none" stroke="#10b981" strokeWidth="3" points={revenuePoints} />

              <text x="475" y="34" className="text-[8px] font-bold fill-slate-400">High</text>
              <text x="475" y="154" className="text-[8px] font-bold fill-slate-400">Low</text>
            </svg>
          </div>
        </div>
      )}

      {/* Reports Table details */}
      {renderReportTable()}
    </div>
  );
};

export default Reports;
