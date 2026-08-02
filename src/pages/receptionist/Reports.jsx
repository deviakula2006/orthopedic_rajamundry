import { useState, useEffect } from 'react';
import { useHospital } from '../../context/HospitalContext';
import apiClient from '../../services/api';
import { Download, Calendar, Users, Receipt, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip as ChartTooltip,
  BarChart,
  Bar
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReceptionistReports = () => {
  const { hospitalSettings, showToast } = useHospital();
  
  // Default range from start of year to today
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState('revenue');

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch report data on tab or date range change
  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/reports/${activeTab}`, {
          params: { dateFrom, dateTo }
        });
        if (active) {
          setReportData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load report:', err);
        showToast(err.response?.data?.error?.message || 'Failed to load report data', 'error');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();
    return () => {
      active = false;
    };
  }, [activeTab, dateFrom, dateTo, showToast]);

  const items = reportData?.items || [];
  const trend = reportData?.trend || [];
  const totalVal = activeTab === 'revenue' 
    ? (reportData?.totalCollected || 0) 
    : activeTab === 'patients' 
      ? (reportData?.totalRegistrations || 0)
      : (reportData?.totalTestsOrdered || 0);

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      const hospitalName = hospitalSettings?.name || 'Rajahmundry Orthopedic Hospital';

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(hospitalName, 14, 18);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      let reportTitle = '';
      let head = [];
      let body = [];
      let fileSuffix = '';

      if (activeTab === 'revenue') {
        reportTitle = 'Revenue Report';
        head = [['Invoice ID', 'Patient Name', 'Consultant', 'Date', 'Grand Total']];
        body = items.map((b) => [b.invoiceNo, b.patientName, b.doctorName, b.date, `Rs.${b.total}`]);
        fileSuffix = 'revenue';
      } else if (activeTab === 'patients') {
        reportTitle = 'Patient Registrations';
        head = [['Patient ID', 'Full Name', 'Age/Gender', 'Phone', 'Registered Date']];
        body = items.map((p) => [p.id, p.name, `${p.age} / ${p.gender}`, p.phone, p.lastVisit]);
        fileSuffix = 'patients';
      } else {
        reportTitle = 'Lab Investigations';
        head = [['Test Code', 'Test Name', 'Patient Info', 'Ordered Date', 'Price']];
        body = items.map((i) => [i.id, i.testName, i.patientName, i.date, `Rs.${i.price}`]);
        fileSuffix = 'investigations';
      }

      doc.text(reportTitle, 14, 26);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Range: ${dateFrom} to ${dateTo}  |  Generated: ${new Date().toISOString().slice(0, 10)}`, 14, 32);

      autoTable(doc, {
        head,
        body,
        startY: 38,
        headStyles: { fillColor: [14, 165, 233] },
        styles: { fontSize: 9 }
      });

      doc.save(`roh-${fileSuffix}-report-${dateFrom}-to-${dateTo}.pdf`);
      showToast('PDF export generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      showToast('Failed to generate PDF export.', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      let filename = "";
      
      if (activeTab === 'revenue') {
        csvContent += "Invoice ID,Patient Name,Consultant,Date,Sub Total,Tax,Discount,Grand Total\n";
        items.forEach(b => {
          csvContent += `"${b.invoiceNo}","${b.patientName}","${b.doctorName}","${b.date}",${b.subTotal},${b.tax},${b.discount},${b.total}\n`;
        });
        filename = `revenue-report-${dateFrom}-to-${dateTo}.csv`;
      } else if (activeTab === 'patients') {
        csvContent += "Patient ID,Full Name,Age,Gender,Blood Group,Phone,Registered Date\n";
        items.forEach(p => {
          csvContent += `"${p.id}","${p.name}",${p.age},"${p.gender}","${p.bloodGroup || 'O+'}","${p.phone}","${p.lastVisit}"\n`;
        });
        filename = `patients-report-${dateFrom}-to-${dateTo}.csv`;
      } else {
        csvContent += "Test Code,Test Name,Patient Name,Ordered Date,Price\n";
        items.forEach(i => {
          csvContent += `"${i.id}","${i.testName}","${i.patientName}","${i.date}",${i.price}\n`;
        });
        filename = `investigations-report-${dateFrom}-to-${dateTo}.csv`;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV export generated successfully!');
    } catch (error) {
      console.error('CSV generation failed:', error);
      showToast('Failed to generate CSV export.', 'error');
    }
  };

  const handleExport = (format) => {
    if (format === 'pdf') {
      handleExportPdf();
    } else {
      handleExportCSV();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-400 font-semibold">Generate printable PDF ledger lists, patient registrations, and diagnostic statistics</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-600 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 px-3 text-xs font-bold text-slate-600 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-premium flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Date From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">Date To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs text-slate-700 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setDateFrom('2026-01-01');
            setDateTo(new Date().toISOString().slice(0, 10));
          }}
          className="rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 px-3 text-xs font-bold text-slate-700 cursor-pointer"
        >
          Reset Range
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'revenue'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Revenue Report
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'patients'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Patient Registrations
        </button>
        <button
          onClick={() => setActiveTab('investigations')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'investigations'
              ? 'border-hospital-500 text-hospital-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Lab Investigations
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl h-64">
          <p className="text-sm font-semibold text-slate-400">Loading report data from database...</p>
        </div>
      ) : (
        /* Tab Panels */
        <>
          {activeTab === 'revenue' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Collected</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalVal)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 block mb-2">Revenue Growth Trend</span>
                <div className="h-28 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <XAxis dataKey="day" stroke="#cbd5e1" />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#ecfdf5" strokeWidth={2.5} />
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
                      <th className="px-6 py-3">Treating Consultant</th>
                      <th className="px-6 py-3 text-right">Tax (5% GST)</th>
                      <th className="px-6 py-3 text-right">Discount (₹)</th>
                      <th className="px-6 py-3 text-right">Collection Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {items.map((b) => (
                      <tr key={b.invoiceNo}>
                        <td className="px-6 py-3 text-hospital-600 font-bold">{b.invoiceNo}</td>
                        <td className="px-6 py-3">{b.patientName}</td>
                        <td className="px-6 py-3 text-slate-500">{b.doctorName}</td>
                        <td className="px-6 py-3 text-right">₹{b.tax}</td>
                        <td className="px-6 py-3 text-right text-red-500">-₹{b.discount}</td>
                        <td className="px-6 py-3 text-right font-extrabold text-slate-800">₹{b.total}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No collections recorded in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registrations</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-hospital-500">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-800">{totalVal} Patients</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 block mb-2">Registrations Weekly Trend</span>
                <div className="h-28 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <XAxis dataKey="day" stroke="#cbd5e1" />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="registrations" stroke="#0ea5e9" fill="#e0f2fe" strokeWidth={2.5} />
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
                      <th className="px-6 py-3">Full Name</th>
                      <th className="px-6 py-3">Age / Gender</th>
                      <th className="px-6 py-3">Diagnosis</th>
                      <th className="px-6 py-3">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {items.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-3 text-hospital-600 font-bold">{p.id}</td>
                        <td className="px-6 py-3">{p.name}</td>
                        <td className="px-6 py-3">{p.age} Yrs / {p.gender}</td>
                        <td className="px-6 py-3 text-slate-500">{p.disease || 'General checkup'}</td>
                        <td className="px-6 py-3 text-slate-400">{p.lastVisit}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
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

          {activeTab === 'investigations' && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Summary Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium flex flex-col justify-between h-44">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tests Ordered</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-extrabold text-slate-800">{totalVal} Tests</span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">For selected date range</span>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium h-44 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-500 block mb-2">Investigation Weekly Trends</span>
                <div className="h-28 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <XAxis dataKey="day" stroke="#cbd5e1" />
                      <ChartTooltip />
                      <Bar dataKey="tests" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="md:col-span-3 rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-premium">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                      <th className="px-6 py-3">Test Code</th>
                      <th className="px-6 py-3">Investigation Name</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Patient Name</th>
                      <th className="px-6 py-3 text-right">Standard Rate (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {items.map((i) => (
                      <tr key={i.id + '-' + i.patientName}>
                        <td className="px-6 py-3 text-hospital-600 font-bold">{i.id}</td>
                        <td className="px-6 py-3">{i.testName}</td>
                        <td className="px-6 py-3 text-slate-500">{i.category}</td>
                        <td className="px-6 py-3 text-slate-500">{i.patientName}</td>
                        <td className="px-6 py-3 text-right font-extrabold text-slate-800">₹{i.price}</td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                          No test orders recorded in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReceptionistReports;
