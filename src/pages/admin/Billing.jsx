import { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Printer, Eye, Receipt, PlusCircle } from 'lucide-react';
import Autocomplete from '../../components/common/Autocomplete';

const Billing = () => {
  const { bills, patients, doctors, investigations, addBill, updateBillStatus } = useHospital();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [billType, setBillType] = useState('Consultation'); // 'Consultation' or 'Investigations'
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [discount, setDiscount] = useState(0);

  // Consultation flow state
  const [consultationFee, setConsultationFee] = useState(500);

  // Investigation flow state
  const [selectedInvId, setSelectedInvId] = useState('');
  const [billItems, setBillItems] = useState([]);

  // Search active patient/doctor names
  const activePatientObj = patients.find((p) => p.id === patientId);
  const activeDoctorObj = doctors.find((d) => d.id === doctorId);

  // Trigger when create modal opens
  const handleOpenCreate = () => {
    setPatientId('');
    setDoctorId('');
    setBillType('Consultation');
    setPaymentMode('UPI');
    setPaymentStatus('Paid');
    setDiscount(0);
    setConsultationFee(500);
    setSelectedInvId('');
    setBillItems([
      {
        description: 'Consultation Fee - Doctor',
        type: 'Consultation',
        amount: 500
      }
    ]);
    setIsCreateOpen(true);
  };

  const handleSelectInvestigation = (invId) => {
    setSelectedInvId(invId);
  };

  // Add selected investigation item to list
  const addInvestigationItem = () => {
    if (!selectedInvId) return;
    const invItem = investigations.find((i) => i.id === selectedInvId);
    if (!invItem) return;

    // Avoid duplicate items
    if (billItems.some((item) => item.code === invItem.id)) {
      alert('This investigation test has already been added to the invoice.');
      return;
    }

    setBillItems([
      ...billItems,
      {
        code: invItem.id,
        description: invItem.testName,
        type: 'Investigation',
        amount: invItem.price
      }
    ]);
    setSelectedInvId('');
  };

  const removeItemFromBill = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  // Dynamic Calculations (no hardcoding)
  const calculateTotals = () => {
    const subTotal = billItems.reduce((acc, item) => acc + item.amount, 0);
    const tax = Math.round(subTotal * 0.05 * 100) / 100; // 5% GST
    const total = Math.max(0, subTotal + tax - parseFloat(discount || 0));
    return { subTotal, tax, total };
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert('Please select a patient.');
      return;
    }
    if (!doctorId) {
      alert('Please select a consulting doctor.');
      return;
    }
    if (billItems.length === 0) {
      alert('Please add at least one item to generate this invoice.');
      return;
    }

    const { subTotal, tax, total } = calculateTotals();

    const newBill = await addBill({
      patientId,
      patientName: activePatientObj?.name || 'Walk-In Patient',
      billType,
      doctorId,
      doctorName: activeDoctorObj?.name || 'Assigned Consultant',
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

  const handleOpenInvoice = (bill) => {
    setSelectedBill(bill);
    setIsInvoiceOpen(true);
  };

  const triggerPrint = () => {
    window.print();
  };

  const columns = [
    {
      key: 'invoiceNo', header: 'Invoice No', sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 4 }}>
          {row.invoiceNo}
        </span>
      )
    },
    {
      key: 'patientName', header: 'Patient', sortable: true,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8125rem' }}>{row.patientName}</div>
          <div style={{ fontWeight: 500, color: '#374151', fontSize: '0.7rem', marginTop: 1 }}>{row.patientId}</div>
        </div>
      )
    },
    {
      key: 'date', header: 'Invoice Date', sortable: true,
      render: (row) => <span style={{ fontWeight: 600, color: '#111827' }}>{row.date}</span>
    },
    {
      key: 'billType',
      header: 'Billing Scope',
      render: (row) => (
        <span
          className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold border ${
            row.billType === 'Investigations'
              ? 'bg-purple-50 text-purple-600 border-purple-100'
              : 'bg-blue-50 text-hospital-600 border-blue-100'
          }`}
        >
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
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#2278e8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
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
                Select Patient
              </label>
              <Autocomplete
                options={patients}
                value={patientId}
                onChange={setPatientId}
                placeholder="Search patient by name..."
                displayKey="name"
                idKey="id"
              />
            </div>

            {/* Searchable Autocomplete Doctor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Treating Consultant
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

            {/* Billing Scope Options: Consultation / Investigations (Remove Pharmacy) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Billing Scope
              </label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="Consultation">OPD Consultation</option>
                <option value="Investigations">Investigations (Lab Tests)</option>
              </select>
            </div>
          </div>

          {/* Consultation Bill Flow */}
          {billType === 'Consultation' ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Consultation Fee (INR)
              </label>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className="w-full sm:w-1/3 rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:outline-none"
              />
            </div>
          ) : (
            /* Investigation Bill Flow */
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Select Investigations
              </h4>

              {/* Investigation Search Autocomplete (Auto Fetch Cost) */}
              <div className="grid gap-3 sm:grid-cols-4 items-end bg-slate-50 p-3 rounded-xl border mb-4">
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Search Investigation Test (Master Catalog)
                  </label>
                  <Autocomplete
                    options={investigations}
                    value={selectedInvId}
                    onChange={handleSelectInvestigation}
                    placeholder="Search diagnostic tests..."
                    displayKey="testName"
                    idKey="id"
                  />
                </div>
                <button
                  type="button"
                  onClick={addInvestigationItem}
                  disabled={!selectedInvId}
                  className="w-full rounded-xl bg-hospital-500 py-2.5 text-xs font-bold text-white hover:bg-hospital-600 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Bill Items Table (User cannot enter cost manually) */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-40 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50/50">
                      <th className="px-4 py-2 text-slate-400 font-bold">Test Name</th>
                      <th className="px-4 py-2 text-slate-400 font-bold text-right">Auto Cost (₹)</th>
                      <th className="px-4 py-2 text-slate-400 font-bold text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {billItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2 text-right font-bold">₹{item.amount}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeItemFromBill(idx)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    ))}
                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-4 py-6 text-center text-slate-400 font-semibold">
                          No investigations selected yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                  <option value="Card">Card Swap</option>
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
              <div className="flex justify-between">
                <span>Tax (5% CGST/SGST):</span>
                <span className="text-slate-800">₹{formTax}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Discount Applied:</span>
                <span>-₹{discount}</span>
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
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-hospital-500 text-xs font-bold text-white shadow-premium hover:bg-hospital-600 cursor-pointer"
            >
              Generate Bill
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Printable Invoice Sheet */}
      <Modal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} title="Print Hospital Invoice Receipt" size="lg">
        {selectedBill && (
          <div className="space-y-6">
            <div className="border rounded-2xl p-6 md:p-8 bg-white shadow-inner select-text">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-hospital-500 to-cyanic-400 text-white shadow-premium">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 leading-none">RAJAHMUNDRY ORTHOPEDIC</h2>
                    <span className="text-[10px] font-bold text-hospital-600 tracking-wider uppercase">
                      Hospital Management System
                    </span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <h4 className="text-sm font-bold text-slate-800">TAX INVOICE</h4>
                  <p className="text-xs text-slate-400 font-semibold">
                    Invoice No: <span className="text-slate-700 font-bold">{selectedBill.invoiceNo}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-semibold">Date: {selectedBill.date}</p>
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
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5">{item.description}</td>
                      <td className="px-4 py-2.5">{item.type}</td>
                      <td className="px-4 py-2.5 text-right">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col items-end pt-4 border-t text-xs font-semibold text-slate-600 space-y-1.5">
                <div className="flex w-64 justify-between">
                  <span>Sub Total:</span>
                  <span className="text-slate-800">₹{selectedBill.subTotal}</span>
                </div>
                <div className="flex w-64 justify-between">
                  <span>CGST/SGST (5%):</span>
                  <span className="text-slate-800">₹{selectedBill.tax}</span>
                </div>
                <div className="flex w-64 justify-between text-red-500">
                  <span>Discount:</span>
                  <span>-₹{selectedBill.discount}</span>
                </div>
                <div className="flex w-64 justify-between text-sm font-extrabold text-slate-800 border-t pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-hospital-600 font-bold text-base">₹{selectedBill.total}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Close Receipt
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-900 shadow-premium flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
