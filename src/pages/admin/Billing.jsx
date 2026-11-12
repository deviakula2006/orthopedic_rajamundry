import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Printer, Eye, Receipt, PlusCircle, Download, RefreshCw } from 'lucide-react';
import Autocomplete from '../../components/common/Autocomplete';
import apiClient from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = () => {
  const {
    bills,
    patients,
    doctors,
    investigations,
    appointmentTypes,
    hospitalSettings,
    addBill,
    updateBillStatus,
    getPendingInvestigations
  } = useHospital();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [billType, setBillType] = useState('Consultation'); // 'Consultation', 'Lab Investigations', 'Both'
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [discount, setDiscount] = useState(0);

  // Billable item selection states
  const [selectedApptTypeId, setSelectedApptTypeId] = useState('');
  const [selectedInvId, setSelectedInvId] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [pendingInvestigations, setPendingInvestigations] = useState([]);
  const [loadingPendingInv, setLoadingPendingInv] = useState(false);

  // Search active patient/doctor names
  const activePatientObj = patients.find((p) => p.id === patientId || p.dbId === patientId || p.code === patientId);
  const activeDoctorObj = doctors.find((d) => d.id === doctorId || d.dbId === doctorId || d.code === doctorId);

  // Configured GST rate from hospital settings (default 0%)
  const gstRate = Number(hospitalSettings?.gstRate ?? 0);

  // Formatted appointment service options for Autocomplete
  const appointmentServiceOptions = (appointmentTypes || [])
    .filter((t) => t.isActive)
    .map((t) => ({
      id: t.id,
      name: t.name,
      defaultFee: t.defaultFee,
      displayName: `${t.name} (₹${t.defaultFee})`
    }));

  // Patient change handler: refreshes pending investigation orders for the patient
  const handlePatientChange = async (newPatientId) => {
    setPatientId(newPatientId);
    setBillItems([]);
    if (!newPatientId) {
      setPendingInvestigations([]);
      return;
    }
    const pat = patients.find((p) => p.id === newPatientId || p.dbId === newPatientId || p.code === newPatientId);
    const pid = pat?.dbId || newPatientId;
    setLoadingPendingInv(true);
    try {
      const items = await getPendingInvestigations(pid);
      setPendingInvestigations(items || []);
    } catch (err) {
      console.error('Failed to load pending investigations for patient:', err);
      setPendingInvestigations([]);
    } finally {
      setLoadingPendingInv(false);
    }
  };

  // Billing scope change handler
  const handleBillTypeChange = (newType) => {
    setBillType(newType);
    if (newType === 'Consultation') {
      setBillItems((prev) => prev.filter((it) => it.type !== 'Investigation'));
    } else if (newType === 'Lab Investigations') {
      setBillItems((prev) => prev.filter((it) => it.type === 'Investigation'));
    }
  };

  // Trigger when create modal opens
  const handleOpenCreate = () => {
    setPatientId('');
    setDoctorId('');
    setBillType('Consultation');
    setPaymentMode('UPI');
    setPaymentStatus('Paid');
    setDiscount(0);
    setSelectedApptTypeId('');
    setSelectedInvId('');
    setBillItems([]);
    setPendingInvestigations([]);
    setIsCreateOpen(true);
  };

  // Add selected appointment service to invoice
  const addAppointmentServiceItem = () => {
    if (!selectedApptTypeId) return;
    const typeObj = appointmentTypes.find((t) => t.id === selectedApptTypeId);
    if (!typeObj) return;

    // Check for duplicate
    if (billItems.some((item) => item.code === typeObj.id)) {
      alert(`"${typeObj.name}" has already been added to this invoice.`);
      return;
    }

    setBillItems([
      ...billItems,
      {
        code: typeObj.id,
        appointmentTypeId: typeObj.id,
        description: `${typeObj.name} Service Fee`,
        type: typeObj.name === 'Follow Up' ? 'Follow Up' : (typeObj.name === 'Therapy' ? 'Therapy' : 'Consultation'),
        amount: Number(typeObj.defaultFee)
      }
    ]);
    setSelectedApptTypeId('');
  };

  // Toggle selection of pending patient investigation order
  const toggleInvestigationOrder = (invOrder) => {
    const isAdded = billItems.some(
      (item) => item.consultationInvestigationId === invOrder.id || item.code === invOrder.id
    );
    if (isAdded) {
      setBillItems((prev) =>
        prev.filter((item) => item.consultationInvestigationId !== invOrder.id && item.code !== invOrder.id)
      );
    } else {
      setBillItems((prev) => [
        ...prev,
        {
          code: invOrder.id,
          orderId: invOrder.id,
          consultationInvestigationId: invOrder.id,
          investigationId: invOrder.investigationId || undefined,
          description: invOrder.testName,
          type: 'Investigation',
          amount: Number(invOrder.price),
          quantity: 1,
          category: invOrder.category,
          investigationCode: invOrder.investigationCode
        }
      ]);
    }
  };

  const removeItemFromBill = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  // Dynamic Calculations using configured GST rate
  const calculateTotals = () => {
    const subTotal = billItems.reduce((acc, item) => acc + item.amount * (item.quantity ?? 1), 0);
    const discountVal = Math.min(subTotal, Math.max(0, parseFloat(discount || 0)));
    const taxableAmount = Math.max(0, subTotal - discountVal);
    const tax = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
    const total = Math.max(0, taxableAmount + tax);
    return { subTotal, taxableAmount, tax, total, gstRate };
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert('Please select a patient.');
      return;
    }
    if (!doctorId && billType !== 'Lab Investigations') {
      alert('Please select a consulting doctor.');
      return;
    }
    if (billItems.length === 0) {
      alert('Please add at least one billable consultation service or eligible investigation order.');
      return;
    }

    const { subTotal, tax, total } = calculateTotals();

    const normalizedBillType =
      billType === 'Lab Investigations' || billType === 'Investigations'
        ? 'Lab'
        : 'OPD';

    const newBill = await addBill({
      patientId,
      patientName: activePatientObj?.name || 'Walk-In Patient',
      billType: normalizedBillType,
      doctorId: doctorId || undefined,
      doctorName: activeDoctorObj?.name || (doctorId ? 'Assigned Consultant' : 'Diagnostic Lab'),
      paymentMode,
      paymentStatus,
      items: billItems,
      subTotal,
      discount: parseFloat(discount || 0),
      tax,
      total
    });

    if (newBill) {
      setIsCreateOpen(false);
      setSelectedBill(newBill);
      setIsInvoiceOpen(true);
    }
  };

  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleOpenInvoice = async (bill) => {
    setSelectedBill(bill);
    setIsInvoiceOpen(true);
    setInvoiceError('');

    const billId = bill.dbId || bill.id;
    if (billId) {
      setLoadingInvoice(true);
      try {
        const res = await apiClient.get(`/bills/${billId}`);
        const fullBill = res.data?.data;
        if (fullBill) {
          setSelectedBill({
            invoiceNo: fullBill.invoiceNo,
            dbId: fullBill.id,
            date: fullBill.billDate,
            billType:
              fullBill.billType === 'OPD'
                ? 'Consultation'
                : fullBill.billType === 'Lab'
                ? 'Investigations'
                : fullBill.billType,
            patientId: fullBill.patient?.code || bill.patientId,
            patientName: fullBill.patient?.name || bill.patientName,
            doctorName: fullBill.doctor?.name || bill.doctorName,
            paymentMode: fullBill.paymentMode || bill.paymentMode,
            paymentStatus: fullBill.paymentStatus || bill.paymentStatus,
            subTotal: Number(fullBill.subTotal ?? bill.subTotal ?? 0),
            discount: Number(fullBill.discount ?? bill.discount ?? 0),
            tax: Number(fullBill.tax ?? bill.tax ?? 0),
            total: Number(fullBill.total ?? bill.total ?? 0),
            items: (fullBill.items || []).map((it) => ({
              description: it.description,
              type: it.type || it.itemType || 'Service',
              amount: Number(it.amount),
              quantity: Number(it.quantity || 1)
            }))
          });
        }
      } catch (err) {
        console.error('Failed to load full invoice details:', err);
        setInvoiceError('Unable to fetch detailed line items from the database.');
      } finally {
        setLoadingInvoice(false);
      }
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedBill) return;
    try {
      const doc = new jsPDF();
      const hospitalName = hospitalSettings?.name || 'Rajahmundry Orthopedic Hospital';
      const address = hospitalSettings?.address || 'Danavaipeta, Tilak Road, Rajahmundry, Andhra Pradesh, 533103';
      const contact = `Phone: ${hospitalSettings?.contactPhone || '+91 883 244 5566'} | Reg: ${hospitalSettings?.licenseNumber || 'AP-MED-ROH-2026-981'}`;

      // Hospital Header
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(hospitalName, 14, 18);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(address, 14, 24);
      doc.text(contact, 14, 29);

      // Invoice Meta
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20);
      doc.text('OFFICIAL TAX INVOICE', 135, 18);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Invoice No: ${selectedBill.invoiceNo}`, 135, 24);
      doc.text(`Date: ${selectedBill.date}`, 135, 29);

      // Divider line
      doc.setDrawColor(220);
      doc.line(14, 34, 196, 34);

      // Patient & Consultant Details
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Patient Details', 14, 42);
      doc.text('Consultation Details', 110, 42);

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Name: ${selectedBill.patientName}`, 14, 48);
      doc.text(`Patient ID: ${selectedBill.patientId}`, 14, 53);
      doc.text(`Scope: ${selectedBill.billType}`, 14, 58);

      doc.text(`Treating Doctor: ${selectedBill.doctorName || 'Hospital Consultant'}`, 110, 48);
      doc.text(`Payment Mode: ${selectedBill.paymentMode || 'N/A'}`, 110, 53);
      doc.text(`Payment Status: ${selectedBill.paymentStatus || 'Paid'}`, 110, 58);

      // Line Items Table
      const itemsList = selectedBill.items && selectedBill.items.length > 0
        ? selectedBill.items
        : [{ description: `${selectedBill.billType} Services`, type: selectedBill.billType, amount: selectedBill.subTotal || selectedBill.total }];

      const head = [['#', 'Service Description', 'Type', 'Amount (Rs.)']];
      const body = itemsList.map((item, idx) => [
        idx + 1,
        item.description,
        item.type,
        `Rs. ${item.amount}`
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 64,
        headStyles: { fillColor: [34, 120, 232] },
        styles: { fontSize: 9 }
      });

      const finalY = doc.lastAutoTable?.finalY || 100;

      // Totals
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Sub Total: Rs. ${selectedBill.subTotal}`, 135, finalY + 10);
      if (selectedBill.discount > 0) {
        doc.text(`Discount: -Rs. ${selectedBill.discount}`, 135, finalY + 16);
      }
      doc.text(`GST (${gstRate}%): Rs. ${selectedBill.tax}`, 135, finalY + (selectedBill.discount > 0 ? 22 : 16));
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Grand Total: Rs. ${selectedBill.total}`, 135, finalY + (selectedBill.discount > 0 ? 30 : 24));

      doc.save(`invoice-${selectedBill.invoiceNo}.pdf`);
    } catch (err) {
      console.error('Invoice PDF export failed:', err);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Table Columns Setup
  const columns = [
    {
      key: 'invoiceNo', header: 'Invoice ID', sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>
          {row.invoiceNo}
        </span>
      )
    },
    {
      key: 'patientName', header: 'Patient Name', sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{row.patientName}</div>
          <div style={{ fontWeight: 500, color: '#64748b', fontSize: '0.7rem' }}>{row.patientId}</div>
        </div>
      )
    },
    {
      key: 'doctorName', header: 'Consultant', sortable: true,
      render: (row) => <span style={{ fontWeight: 600, color: '#334155' }}>{row.doctorName || '—'}</span>
    },
    {
      key: 'billType', header: 'Scope',
      render: (row) => (
        <span style={{ display: 'inline-block', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
          {row.billType}
        </span>
      )
    },
    {
      key: 'total', header: 'Grand Total', sortable: true,
      render: (row) => <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>₹{row.total}</span>
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => updateBillStatus(row.invoiceNo, row.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-all cursor-pointer ${
            row.paymentStatus === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
          }`}
          title="Click to toggle status"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              row.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          ></span>
          {row.paymentStatus}
        </button>
      )
    }
  ];

  const { subTotal: formSub, tax: formTax, total: formTotal } = calculateTotals();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #e8eaed' }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0a0f1e', letterSpacing: '-0.01em' }}>Billing</h2>
          <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', marginTop: 2 }}>
            {bills.length} invoice{bills.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 8, border: 'none', background: '#2278e8', fontSize: '0.8125rem', fontWeight: 600, color: '#fff', cursor: 'pointer', boxShadow: '0 1px 2px rgba(34,120,232,0.3)' }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          New Invoice
        </button>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <Table
          columns={columns}
          data={bills}
          searchPlaceholder="Search invoices by patient name..."
          searchKey="patientName"
          emptyMessage="No billing invoices recorded"
          itemsPerPage={6}
          actions={(row) => (
            <button
              type="button"
              onClick={() => handleOpenInvoice(row)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', transition: 'all 100ms' }}
              title="View Invoice"
              onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#2278e8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
            >
              <Eye style={{ width: 14, height: 14 }} />
            </button>
          )}
        />
      </div>

      {/* Modal: Create Bill */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Generate New Invoice" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Searchable Autocomplete Patient Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                options={patients}
                value={patientId}
                onChange={handlePatientChange}
                placeholder="Search patient by name or ID..."
                displayKey="name"
                idKey="id"
              />
            </div>

            {/* Searchable Autocomplete Doctor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Treating Consultant {billType !== 'Lab Investigations' && <span className="text-red-500">*</span>}
              </label>
              <Autocomplete
                options={doctors.filter((d) => d.status === 'Active')}
                value={doctorId}
                onChange={setDoctorId}
                placeholder="Search doctor by name..."
                displayKey="name"
                idKey="id"
              />
            </div>

            {/* Billing Scope Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Billing Category
              </label>
              <select
                value={billType}
                onChange={(e) => handleBillTypeChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="Consultation">Consultation</option>
                <option value="Lab Investigations">Lab Investigations</option>
                <option value="Both">Both (Consultation & Lab Investigations)</option>
              </select>
            </div>
          </div>

          {/* Appointment Services Search & Select Section */}
          {(billType === 'Consultation' || billType === 'Both' || billType === 'Appointments' || billType === 'Combined') && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Add Consultation / Hospital Service
              </label>
              <div className="grid gap-3 sm:grid-cols-4 items-end">
                <div className="sm:col-span-3">
                  <Autocomplete
                    options={appointmentServiceOptions}
                    value={selectedApptTypeId}
                    onChange={setSelectedApptTypeId}
                    placeholder="Search appointment service (e.g. Consultation, Therapy, Follow Up)..."
                    displayKey="displayName"
                    idKey="id"
                  />
                </div>
                <button
                  type="button"
                  onClick={addAppointmentServiceItem}
                  disabled={!selectedApptTypeId}
                  className="w-full rounded-xl bg-hospital-500 py-2.5 text-xs font-bold text-white hover:bg-hospital-600 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Service</span>
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Eligible Investigation Orders Section */}
          {(billType === 'Lab Investigations' || billType === 'Both' || billType === 'Investigations' || billType === 'Combined') && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Eligible Diagnostic Investigation Orders
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Pending tests ordered for {activePatientObj?.name || 'the selected patient'}
                  </p>
                </div>
                {patientId && (
                  <button
                    type="button"
                    onClick={() => handlePatientChange(patientId)}
                    disabled={loadingPendingInv}
                    className="text-xs text-hospital-600 hover:text-hospital-700 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Refresh eligible orders"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPendingInv ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {!patientId ? (
                <div className="p-3.5 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 font-medium">
                  Please select a patient above to view their eligible investigation orders.
                </div>
              ) : loadingPendingInv ? (
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-hospital-500 border-t-transparent" />
                  <span>Retrieving eligible investigation orders...</span>
                </div>
              ) : pendingInvestigations.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs font-semibold text-slate-500">
                  No pending investigations available for billing.
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {pendingInvestigations.map((invOrder) => {
                    const isAdded = billItems.some(
                      (item) => item.consultationInvestigationId === invOrder.id || item.code === invOrder.id
                    );
                    const formattedDate = invOrder.orderedAt
                      ? new Date(invOrder.orderedAt).toLocaleString('en-US', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '—';

                    return (
                      <div
                        key={invOrder.id}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isAdded
                            ? 'bg-blue-50/80 border-blue-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{invOrder.testName}</span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {invOrder.investigationCode}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {invOrder.category || 'Diagnostic'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                              {invOrder.clinicalStatus || 'Ordered'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                            <span>Ordered: <strong className="text-slate-700">{formattedDate}</strong></span>
                            <span>By: <strong className="text-slate-700">{invOrder.orderedBy || 'Staff'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className="font-extrabold text-sm text-slate-900">
                            ₹{invOrder.price}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleInvestigationOrder(invOrder)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isAdded
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                : 'bg-hospital-500 text-white hover:bg-hospital-600 shadow-sm'
                            }`}
                          >
                            {isAdded ? (
                              <span>Remove</span>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Add to Bill</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bill Items Table */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selected Billable Items ({billItems.length})
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-2.5">Item Description</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Standard Fee (₹)</th>
                    <th className="px-4 py-2.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {billItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-bold text-slate-800">{item.description}</td>
                      <td className="px-4 py-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-slate-800">₹{item.amount}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemFromBill(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-base cursor-pointer px-2"
                          title="Remove item"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {billItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-400 font-medium">
                        No billable items added yet. Search and add services or lab tests above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form summary layout */}
          <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 pt-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Insurance Claim">Insurance Claim</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm text-slate-600 font-semibold self-end">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-slate-800">₹{formSub}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount:</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500">
                <span>GST ({gstRate}%):</span>
                <span className="text-slate-800 font-bold">₹{formTax}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-800 border-t pt-2 mt-2">
                <span>Total Bill Amount:</span>
                <span className="text-hospital-600">₹{formTotal}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={billItems.length === 0}
              className="rounded-xl bg-hospital-500 hover:bg-hospital-600 py-2.5 px-6 text-xs font-bold text-white shadow-premium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Receipt className="h-4 w-4" />
              <span>Generate Invoice</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View & Print Invoice */}
      {selectedBill && (
        <Modal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} title="Patient Tax Invoice" size="lg">
          <div className="space-y-6">
            <div className="p-6 border rounded-2xl bg-white shadow-sm print:border-none print:shadow-none" id="invoice-receipt">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    {hospitalSettings?.name || 'Rajahmundry Orthopedic Hospital'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    {hospitalSettings?.address || 'Danavaipeta, Tilak Road, Rajahmundry, Andhra Pradesh, 533103'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phone: {hospitalSettings?.contactPhone || '+91 883 244 5566'} | Reg: {hospitalSettings?.licenseNumber || 'AP-MED-ROH-2026-981'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-hospital-600 bg-hospital-50 border border-hospital-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    Official Receipt
                  </span>
                  <p className="text-sm font-extrabold text-slate-800 mt-2 font-mono">{selectedBill.invoiceNo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedBill.date}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 py-6 border-b text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Patient Details
                  </span>
                  <p className="text-sm font-bold text-slate-800">{selectedBill.patientName}</p>
                  <p>ID: {selectedBill.patientId}</p>
                  <p>Scope: {selectedBill.billType}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Consultation Details
                  </span>
                  <p className="text-sm font-bold text-slate-800">{selectedBill.doctorName}</p>
                  <p>Payment Mode: {selectedBill.paymentMode}</p>
                  <p>
                    Payment Status:{' '}
                    <span
                      className={`font-extrabold ${
                        selectedBill.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    >
                      {selectedBill.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {loadingInvoice ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm font-semibold">
                  <RefreshCw className="w-5 h-5 animate-spin text-hospital-500" />
                  <span>Loading invoice details from database...</span>
                </div>
              ) : (
                <>
                  {invoiceError && (
                    <div className="p-3 my-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                      {invoiceError}
                    </div>
                  )}

                  <table className="w-full text-left text-xs border-collapse my-6">
                    <thead>
                      <tr className="border-b bg-slate-50 font-bold text-slate-400 uppercase">
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Service Description</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedBill.items && selectedBill.items.length > 0 ? (
                        selectedBill.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-2.5">{item.description}</td>
                            <td className="px-4 py-2.5">{item.type}</td>
                            <td className="px-4 py-2.5 text-right">₹{item.amount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2.5 text-slate-400">1</td>
                          <td className="px-4 py-2.5">{selectedBill.billType} Care & Service Fee</td>
                          <td className="px-4 py-2.5">{selectedBill.billType}</td>
                          <td className="px-4 py-2.5 text-right">₹{selectedBill.subTotal || selectedBill.total}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="flex flex-col items-end pt-4 border-t text-xs font-semibold text-slate-600 space-y-1.5">
                    <div className="flex w-64 justify-between">
                      <span>Sub Total:</span>
                      <span className="text-slate-800">₹{selectedBill.subTotal}</span>
                    </div>
                    {selectedBill.discount > 0 && (
                      <div className="flex w-64 justify-between text-red-500">
                        <span>Discount:</span>
                        <span>-₹{selectedBill.discount}</span>
                      </div>
                    )}
                    <div className="flex w-64 justify-between">
                      <span>GST ({gstRate}%):</span>
                      <span className="text-slate-800">₹{selectedBill.tax}</span>
                    </div>
                    <div className="flex w-64 justify-between text-sm font-extrabold text-slate-800 border-t pt-2 mt-1">
                      <span>Grand Total:</span>
                      <span className="text-hospital-600 font-bold text-base">₹{selectedBill.total}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4 text-hospital-600" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="rounded-xl border border-slate-200 py-2.5 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                className="rounded-xl bg-slate-900 hover:bg-black py-2.5 px-5 text-xs font-bold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Billing;
