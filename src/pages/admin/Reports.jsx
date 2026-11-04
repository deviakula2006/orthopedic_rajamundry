import { useState, useEffect, useMemo } from 'react';
import { useHospital } from '../../context/HospitalContext';
import apiClient from '../../services/api';
import {
  Download,
  Calendar,
  Users,
  Receipt,
  Stethoscope,
  FlaskConical,
  Eye,
  Hourglass,
  Layers,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getNowInIST } from '../../utils/dateTime';
import InvoiceModal from '../../components/common/InvoiceModal';
import PatientDetailsModal from '../../components/common/PatientDetailsModal';

function formatDateTime(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hh = String(hours).padStart(2, '0');
    return `${day}-${month}-${year}, ${hh}:${minutes} ${ampm}`;
  } catch {
    return String(val);
  }
}

function formatDateOnly(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(val);
  }
}

function formatCurrency(val) {
  const num = Number(val || 0);
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })
  );
}

const ITEMS_PER_PAGE = 8;

const Reports = () => {
  const { hospitalSettings, showToast } = useHospital();

  // Date filters: Default from start of year to current IST date
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState(getNowInIST().dateStr);

  // Active Main Tab: 'revenue' | 'consultations' | 'investigations' | 'patients'
  const [activeTab, setActiveTab] = useState('revenue');

  // Sub-section filter for Paid vs Pending inside billing tabs
  const [revenueFilter, setRevenueFilter] = useState('Paid'); // 'Paid' | 'Pending'
  const [consultFilter, setConsultFilter] = useState('Paid');
  const [investigationFilter, setInvestigationFilter] = useState('Paid');

  // Pagination page state per tab
  const [page, setPage] = useState(1);

  // Data fetching state
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states for reused components
  const [selectedBill, setSelectedBill] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Reset pagination on tab or sub-section change
  useEffect(() => {
    setPage(1);
  }, [activeTab, revenueFilter, consultFilter, investigationFilter]);

  // Fetch report data whenever active tab or date range changes
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
  const summary = reportData?.summary || {};

  // Handlers for Opening Details
  const handleOpenInvoiceModal = (bill) => {
    setSelectedBill(bill);
    setIsInvoiceOpen(true);
  };

  const handleOpenPatientModal = (patient) => {
    setSelectedPatient(patient);
    setIsPatientModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // ALL REVENUE TAB FILTERED LISTS & CALCULATIONS
  // ---------------------------------------------------------------------------
  const paidRevenueInvoices = useMemo(
    () => items.filter((b) => b.paymentStatus === 'Paid'),
    [items]
  );
  const pendingRevenueInvoices = useMemo(
    () => items.filter((b) => b.paymentStatus !== 'Paid'),
    [items]
  );

  const displayedRevenueInvoices =
    revenueFilter === 'Paid' ? paidRevenueInvoices : pendingRevenueInvoices;

  const revPaidTotal = summary.totalPaidRevenue ?? 0;
  const revPaidConsult = summary.consultationPaidRevenue ?? 0;
  const revPaidInv = summary.investigationPaidRevenue ?? 0;

  const revPendingTotal = summary.totalPendingAmount ?? 0;
  const revPendingConsult = summary.consultationPendingAmount ?? 0;
  const revPendingInv = summary.investigationPendingAmount ?? 0;

  // ---------------------------------------------------------------------------
  // CONSULTATIONS TAB FILTERED LISTS
  // ---------------------------------------------------------------------------
  const paidConsultations = useMemo(
    () => items.filter((b) => b.paymentStatus === 'Paid'),
    [items]
  );
  const pendingConsultations = useMemo(
    () => items.filter((b) => b.paymentStatus !== 'Paid'),
    [items]
  );

  const displayedConsultations =
    consultFilter === 'Paid' ? paidConsultations : pendingConsultations;

  // ---------------------------------------------------------------------------
  // LAB INVESTIGATIONS TAB FILTERED LISTS
  // ---------------------------------------------------------------------------
  const paidInvestigations = useMemo(
    () => items.filter((b) => b.paymentStatus === 'Paid'),
    [items]
  );
  const pendingInvestigations = useMemo(
    () => items.filter((b) => b.paymentStatus !== 'Paid'),
    [items]
  );

  const displayedInvestigations =
    investigationFilter === 'Paid' ? paidInvestigations : pendingInvestigations;

  // ---------------------------------------------------------------------------
  // PAGINATION CALCULATIONS
  // ---------------------------------------------------------------------------
  let currentTabList = [];
  if (activeTab === 'revenue') currentTabList = displayedRevenueInvoices;
  else if (activeTab === 'consultations') currentTabList = displayedConsultations;
  else if (activeTab === 'investigations') currentTabList = displayedInvestigations;
  else currentTabList = items;

  const totalPages = Math.max(1, Math.ceil(currentTabList.length / ITEMS_PER_PAGE));
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedList = currentTabList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // ---------------------------------------------------------------------------
  // EXPORT HANDLERS (PDF LEDGER & CSV)
  // ---------------------------------------------------------------------------
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
        reportTitle = `All Revenue Report (${revenueFilter} Invoices)`;
        head = [
          ['Invoice ID', 'Patient Name', 'Date & Time', 'Category', 'Payment Status', 'Total Amount']
        ];
        body = displayedRevenueInvoices.map((b) => [
          b.invoiceNo,
          b.patientName,
          formatDateTime(b.dateTime || b.date),
          b.category,
          b.paymentStatus,
          `Rs. ${b.total}`
        ]);
        fileSuffix = `revenue-${revenueFilter.toLowerCase()}`;
      } else if (activeTab === 'consultations') {
        reportTitle = `Consultations Revenue Report (${consultFilter} Invoices)`;
        head = [
          ['Invoice ID', 'Patient Name', 'Consultation Type', 'Date & Time', 'Doctor Name', 'Consultation Amount', 'Status']
        ];
        body = displayedConsultations.map((b) => [
          b.invoiceNo,
          b.patientName,
          b.consultationType || 'Consultation',
          formatDateTime(b.dateTime || b.date),
          b.doctorName || '—',
          `Rs. ${b.consultationRevenue ?? b.consultationAmount ?? b.total}`,
          b.paymentStatus
        ]);
        fileSuffix = `consultations-${consultFilter.toLowerCase()}`;
      } else if (activeTab === 'investigations') {
        reportTitle = `Lab Investigations Report (${investigationFilter} Invoices)`;
        head = [
          ['Invoice ID', 'Patient Name', 'Investigation Type / Name', 'Date & Time', 'Investigation Amount', 'Status']
        ];
        body = displayedInvestigations.map((b) => [
          b.invoiceNo,
          b.patientName,
          b.investigationName || 'Diagnostic Investigation',
          formatDateTime(b.dateTime || b.date),
          `Rs. ${b.investigationAmount ?? b.totalAmount ?? b.total}`,
          b.paymentStatus
        ]);
        fileSuffix = `investigations-${investigationFilter.toLowerCase()}`;
      } else {
        reportTitle = 'Patient Registrations Directory';
        head = [
          ['Patient ID', 'Patient Name', 'Age / Gender', 'Assigned Doctor', 'Diagnosis', 'Registration Date']
        ];
        body = items.map((p) => [
          p.code || p.id,
          p.name,
          `${p.age ?? '—'} Yrs / ${p.gender ?? '—'}`,
          p.assignedDoctor || 'Not Assigned',
          p.diagnosis || p.disease || 'General checkup',
          formatDateOnly(p.registeredDate || p.createdAt || p.lastVisit)
        ]);
        fileSuffix = 'patients';
      }

      doc.text(reportTitle, 14, 26);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Range: ${dateFrom} to ${dateTo}  |  Generated: ${getNowInIST().dateStr}`, 14, 32);

      autoTable(doc, {
        head,
        body,
        startY: 38,
        headStyles: { fillColor: [29, 111, 233] },
        styles: { fontSize: 8.5 }
      });

      doc.save(`roh-${fileSuffix}-${dateFrom}-to-${dateTo}.pdf`);
      showToast('PDF export generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      showToast('Failed to generate PDF export.', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      let filename = '';

      if (activeTab === 'revenue') {
        csvContent += 'Invoice ID,Patient Name,Date & Time,Category,Payment Status,Total Amount\n';
        displayedRevenueInvoices.forEach((b) => {
          csvContent += `"${b.invoiceNo}","${b.patientName}","${formatDateTime(b.dateTime || b.date)}","${b.category}","${b.paymentStatus}",${b.total}\n`;
        });
        filename = `all-revenue-${revenueFilter.toLowerCase()}-${dateFrom}-to-${dateTo}.csv`;
      } else if (activeTab === 'consultations') {
        csvContent += 'Invoice ID,Patient Name,Consultation Type,Date & Time,Doctor Name,Consultation Amount,Payment Status\n';
        displayedConsultations.forEach((b) => {
          csvContent += `"${b.invoiceNo}","${b.patientName}","${b.consultationType || 'Consultation'}","${formatDateTime(b.dateTime || b.date)}","${b.doctorName || ''}",${b.consultationRevenue ?? b.consultationAmount ?? b.total},"${b.paymentStatus}"\n`;
        });
        filename = `consultations-${consultFilter.toLowerCase()}-${dateFrom}-to-${dateTo}.csv`;
      } else if (activeTab === 'investigations') {
        csvContent += 'Invoice ID,Patient Name,Investigation Type / Name,Date & Time,Investigation Amount,Payment Status\n';
        displayedInvestigations.forEach((b) => {
          csvContent += `"${b.invoiceNo}","${b.patientName}","${b.investigationName || 'Diagnostic Investigation'}","${formatDateTime(b.dateTime || b.date)}",${b.investigationAmount ?? b.totalAmount ?? b.total},"${b.paymentStatus}"\n`;
        });
        filename = `investigations-${investigationFilter.toLowerCase()}-${dateFrom}-to-${dateTo}.csv`;
      } else {
        csvContent += 'Patient ID,Patient Name,Age / Gender,Assigned Doctor,Diagnosis,Registration Date\n';
        items.forEach((p) => {
          csvContent += `"${p.code || p.id}","${p.name}","${p.age ?? ''} Yrs / ${p.gender ?? ''}","${p.assignedDoctor || 'Not Assigned'}","${p.diagnosis || p.disease || ''}","${formatDateOnly(p.registeredDate || p.createdAt)}"\n`;
        });
        filename = `patient-registrations-${dateFrom}-to-${dateTo}.csv`;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV export generated successfully!');
    } catch (error) {
      console.error('CSV generation failed:', error);
      showToast('Failed to generate CSV export.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Generate revenue reports, consultations, investigations and patient registrations
          </p>
        </div>
      </div>

      {/* ─── Filter & Action Bar ──────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Date inputs & Reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 font-bold">Date From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 font-bold">Date To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setDateFrom('2026-01-01');
              setDateTo(getNowInIST().dateStr);
            }}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 py-2 px-3.5 text-xs font-bold text-slate-700 transition-all cursor-pointer"
          >
            Reset Range
          </button>
        </div>

        {/* Right: Export actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4 text-hospital-600" />
            <span>Export PDF Ledger</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3.5 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── Four Navigation Tabs (Wireframe Style) ────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'bg-[#1d6fe9] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All Revenue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consultations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'consultations'
              ? 'bg-[#1d6fe9] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          <span>Consultations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investigations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'investigations'
              ? 'bg-[#1d6fe9] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Lab Investigations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'patients'
              ? 'bg-[#1d6fe9] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Patient Registrations</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl h-64">
          <p className="text-sm font-semibold text-slate-400">Loading verified database records...</p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════
              TAB 1: ALL REVENUE (MATCHING EXACT WIREFRAME)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'revenue' && (
            <div className="space-y-5">
              {/* Four Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Paid Revenue (Green Theme) */}
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Total Paid Revenue</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(revPaidTotal)}
                    </span>
                  </div>
                </div>

                {/* 2. Total Pending Amount (Amber Theme) */}
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                      <Hourglass className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Total Pending Amount</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(revPendingTotal)}
                    </span>
                  </div>
                </div>

                {/* 3. Consultation Revenue (Paid) (Blue Theme) */}
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Consultation Revenue</span>
                      <span className="text-[10px] font-bold text-blue-600">(Paid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(revPaidConsult)}
                    </span>
                  </div>
                </div>

                {/* 4. Investigation Revenue (Paid) (Purple Theme) */}
                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Investigation Revenue</span>
                      <span className="text-[10px] font-bold text-purple-600">(Paid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(revPaidInv)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selectable Section (Paid vs Pending) & Breakdown Strip */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                {/* Left: Pill toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevenueFilter('Paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      revenueFilter === 'Paid'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Paid Invoices ({paidRevenueInvoices.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setRevenueFilter('Pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      revenueFilter === 'Pending'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Pending Invoices ({pendingRevenueInvoices.length})
                  </button>
                </div>

                {/* Right: Accurate Category Breakdown Strip */}
                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  {revenueFilter === 'Paid' ? (
                    <>
                      <span>
                        Paid Total:{' '}
                        <span className="text-slate-900 font-extrabold">{formatCurrency(revPaidTotal)}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Consultation:{' '}
                        <span className="text-blue-600 font-extrabold">{formatCurrency(revPaidConsult)}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Investigation:{' '}
                        <span className="text-purple-600 font-extrabold">{formatCurrency(revPaidInv)}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Pending Total:{' '}
                        <span className="text-slate-900 font-extrabold">{formatCurrency(revPendingTotal)}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Consultation:{' '}
                        <span className="text-blue-600 font-extrabold">{formatCurrency(revPendingConsult)}</span>
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>
                        Investigation:{' '}
                        <span className="text-purple-600 font-extrabold">{formatCurrency(revPendingInv)}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Exact 6 Required Table Columns */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50/80 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                        <th className="px-5 py-3">Invoice ID</th>
                        <th className="px-5 py-3">Patient Name</th>
                        <th className="px-5 py-3">Date & Time</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Payment Status</th>
                        <th className="px-5 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {paginatedList.map((b) => (
                        <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="text-[#1d6fe9] hover:underline cursor-pointer focus:outline-none"
                              title="Click to view official invoice"
                            >
                              {b.invoiceNo}
                            </button>
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">{b.patientName}</td>
                          <td className="px-5 py-3 text-slate-600">
                            {formatDateTime(b.dateTime || b.date)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                b.category === 'Both'
                                  ? 'bg-purple-100/70 text-purple-800 border-purple-200'
                                  : b.category === 'Investigation'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {b.category}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                b.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  b.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(b.total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="p-1.5 text-slate-400 hover:text-hospital-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedList.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-medium">
                            No {revenueFilter.toLowerCase()} invoices found in the selected date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {paginatedList.length > 0 ? startIndex + 1 : 0} –{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, currentTabList.length)} of {currentTabList.length}{' '}
                    invoices
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-[#1d6fe9] text-white font-bold">
                      {page}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: CONSULTATIONS TAB
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'consultations' && (
            <div className="space-y-5">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Consultation Revenue</span>
                      <span className="text-[10px] font-bold text-blue-600">(Paid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(summary.paidConsultationRevenue ?? summary.totalCollected ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                      <Hourglass className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Total Pending Consultation</span>
                      <span className="text-[10px] font-bold text-amber-600">(Unpaid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(summary.pendingConsultationAmount ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Paid Consultation Invoices</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {paidConsultations.length} Invoices
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Pending Consultation Invoices</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {pendingConsultations.length} Invoices
                    </span>
                  </div>
                </div>
              </div>

              {/* Selectable Section (Paid vs Pending) & Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultFilter('Paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      consultFilter === 'Paid'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Paid Invoices ({paidConsultations.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultFilter('Pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      consultFilter === 'Pending'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Pending Invoices ({pendingConsultations.length})
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <span>
                    Consultation Total:{' '}
                    <span className="text-slate-900 font-extrabold">
                      {formatCurrency(
                        consultFilter === 'Paid'
                          ? summary.paidConsultationRevenue ?? summary.totalCollected ?? 0
                          : summary.pendingConsultationAmount ?? 0
                      )}
                    </span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Invoices:{' '}
                    <span className="text-blue-600 font-extrabold">
                      {displayedConsultations.length}
                    </span>
                  </span>
                </div>
              </div>

              {/* Required Columns: Invoice ID, Patient Name, Consultation Type, Date & Time, Doctor Name, Total Consultation Amount, Payment Status */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50/80 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                        <th className="px-5 py-3">Invoice ID</th>
                        <th className="px-5 py-3">Patient Name</th>
                        <th className="px-5 py-3">Consultation Type</th>
                        <th className="px-5 py-3">Date & Time</th>
                        <th className="px-5 py-3">Doctor Name</th>
                        <th className="px-5 py-3 text-right">Consultation Amount</th>
                        <th className="px-5 py-3">Payment Status</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {paginatedList.map((b) => (
                        <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="text-[#1d6fe9] hover:underline cursor-pointer focus:outline-none"
                              title="Click to view official invoice"
                            >
                              {b.invoiceNo}
                            </button>
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">{b.patientName}</td>
                          <td className="px-5 py-3">
                            <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700">
                              {b.consultationType || 'Consultation'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {formatDateTime(b.dateTime || b.date)}
                          </td>
                          <td className="px-5 py-3 text-slate-800 font-bold">
                            {b.doctorName || 'Hospital Consultant'}
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(b.consultationRevenue ?? b.consultationAmount ?? b.total)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                b.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  b.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="p-1.5 text-slate-400 hover:text-hospital-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedList.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-10 text-center text-slate-400 font-medium">
                            No consultation records found in the selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {paginatedList.length > 0 ? startIndex + 1 : 0} –{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, currentTabList.length)} of {currentTabList.length}{' '}
                    consultations
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-[#1d6fe9] text-white font-bold">
                      {page}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: LAB INVESTIGATIONS TAB
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'investigations' && (
            <div className="space-y-5">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Investigation Revenue</span>
                      <span className="text-[10px] font-bold text-purple-600">(Paid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(summary.paidInvestigationRevenue ?? summary.totalCollected ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                      <Hourglass className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-600 block">Total Pending Investigation</span>
                      <span className="text-[10px] font-bold text-amber-600">(Unpaid)</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(summary.pendingInvestigationAmount ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Paid Investigation Invoices</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {paidInvestigations.length} Invoices
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Pending Investigation Invoices</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {pendingInvestigations.length} Invoices
                    </span>
                  </div>
                </div>
              </div>

              {/* Selectable Section (Paid vs Pending) & Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInvestigationFilter('Paid')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      investigationFilter === 'Paid'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Paid Invoices ({paidInvestigations.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvestigationFilter('Pending')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      investigationFilter === 'Pending'
                        ? 'bg-[#1d6fe9] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Pending Invoices ({pendingInvestigations.length})
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                  <span>
                    Investigation Total:{' '}
                    <span className="text-slate-900 font-extrabold">
                      {formatCurrency(
                        investigationFilter === 'Paid'
                          ? summary.paidInvestigationRevenue ?? summary.totalCollected ?? 0
                          : summary.pendingInvestigationAmount ?? 0
                      )}
                    </span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Invoices:{' '}
                    <span className="text-purple-600 font-extrabold">
                      {displayedInvestigations.length}
                    </span>
                  </span>
                </div>
              </div>

              {/* Required Columns: Invoice ID, Patient Name, Investigation Type / Name, Date & Time, Total Investigation Amount, Payment Status */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50/80 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                        <th className="px-5 py-3">Invoice ID</th>
                        <th className="px-5 py-3">Patient Name</th>
                        <th className="px-5 py-3">Investigation Type / Name</th>
                        <th className="px-5 py-3">Date & Time</th>
                        <th className="px-5 py-3 text-right">Investigation Amount</th>
                        <th className="px-5 py-3">Payment Status</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {paginatedList.map((b) => (
                        <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="text-[#1d6fe9] hover:underline cursor-pointer focus:outline-none"
                              title="Click to view official invoice"
                            >
                              {b.invoiceNo}
                            </button>
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">{b.patientName}</td>
                          <td className="px-5 py-3">
                            <span className="inline-block bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                              {b.investigationName || 'Diagnostic Investigation'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {formatDateTime(b.dateTime || b.date)}
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(b.investigationAmount ?? b.totalAmount ?? b.total)}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                b.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  b.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {b.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoiceModal(b)}
                              className="p-1.5 text-slate-400 hover:text-hospital-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                              title="View Invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedList.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-medium">
                            No investigation records found in the selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {paginatedList.length > 0 ? startIndex + 1 : 0} –{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, currentTabList.length)} of {currentTabList.length}{' '}
                    investigations
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-[#1d6fe9] text-white font-bold">
                      {page}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 4: PATIENT REGISTRATIONS (WITH ASSIGNED DOCTOR)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'patients' && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Total Registrations</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {items.length} Patients
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">With Assigned Doctor</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {summary.assignedCount ?? items.filter((p) => p.assignedDoctor && p.assignedDoctor !== 'Not Assigned').length} Patients
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <UserX className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Unassigned Patients</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {summary.unassignedCount ?? items.filter((p) => !p.assignedDoctor || p.assignedDoctor === 'Not Assigned').length} Patients
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Active Window</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-bold text-slate-700 block">
                      {dateFrom} to {dateTo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Required Columns: Patient ID, Patient Name, Age / Gender, Assigned Doctor, Diagnosis, Registration Date */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50/80 font-bold text-slate-500 uppercase text-[11px] tracking-wider">
                        <th className="px-5 py-3">Patient ID</th>
                        <th className="px-5 py-3">Patient Name</th>
                        <th className="px-5 py-3">Age / Gender</th>
                        <th className="px-5 py-3">Assigned Doctor</th>
                        <th className="px-5 py-3">Diagnosis</th>
                        <th className="px-5 py-3">Registration Date</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {paginatedList.map((p) => (
                        <tr key={p.id || p.code} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold">
                            <button
                              type="button"
                              onClick={() => handleOpenPatientModal(p)}
                              className="text-[#1d6fe9] hover:underline cursor-pointer focus:outline-none"
                              title="Click to view full patient demographics"
                            >
                              {p.code || p.id}
                            </button>
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => handleOpenPatientModal(p)}
                              className="hover:underline cursor-pointer focus:outline-none text-left"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {p.age ?? '—'} Yrs &middot; {p.gender ?? '—'}
                          </td>
                          <td className="px-5 py-3">
                            {p.assignedDoctor && p.assignedDoctor !== 'Not Assigned' ? (
                              <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-md font-bold">
                                {p.assignedDoctor}
                              </span>
                            ) : (
                              <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {p.diagnosis || p.disease || 'General checkup'}
                          </td>
                          <td className="px-5 py-3 text-slate-500 font-medium">
                            {formatDateOnly(p.registeredDate || p.createdAt || p.lastVisit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPatientModal(p)}
                              className="p-1.5 text-slate-400 hover:text-hospital-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-all"
                              title="View Patient Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedList.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-400 font-medium">
                            No patient registrations found in the selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                  <span>
                    Showing {paginatedList.length > 0 ? startIndex + 1 : 0} –{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, currentTabList.length)} of {currentTabList.length}{' '}
                    patients
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-[#1d6fe9] text-white font-bold">
                      {page}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Reused Shared Modals ─────────────────────────────── */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
      />

      <PatientDetailsModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
      />
    </div>
  );
};

export default Reports;
