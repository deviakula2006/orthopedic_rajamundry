import React, { useState } from 'react';
import { useHospital } from '../../context/HospitalContext';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Printer, Trash2, Eye, Receipt, User, Stethoscope, PlusCircle, CheckCircle } from 'lucide-react';

const Billing = () => {
  const { bills, patients, doctors, addBill, updateBillStatus } = useHospital();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form states
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [billType, setBillType] = useState('OPD');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [discount, setDiscount] = useState(0);

  // Bill items state
  const [billItems, setBillItems] = useState([
    { description: 'Consultation Fee', type: 'Consultation', amount: 500 }
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState('Consultation');
  const [newItemAmount, setNewItemAmount] = useState('');

  const handleOpenCreate = () => {
    setPatientId(patients[0]?.id || '');
    setDoctorName(doctors[0]?.name || 'Dr. Arjun Kumar');
    setBillType('OPD');
    setPaymentMode('UPI');
    setPaymentStatus('Paid');
    setDiscount(0);
    setBillItems([{ description: 'Consultation Fee', type: 'Consultation', amount: 500 }]);
    setNewItemDesc('');
    setNewItemAmount('');
    setIsCreateOpen(true);
  };

  const addItemToBill = () => {
    if (newItemDesc.trim() === '' || !newItemAmount) return;
    setBillItems([
      ...billItems,
      {
        description: newItemDesc,
        type: newItemType,
        amount: parseFloat(newItemAmount)
      }
    ]);
    setNewItemDesc('');
    setNewItemAmount('');
  };

  const removeItemFromBill = (idx) => {
    setBillItems(billItems.filter((_, i) => i !== idx));
  };

  // Calculations
  const calculateTotals = () => {
    const subTotal = billItems.reduce((acc, item) => acc + item.amount, 0);
    const tax = Math.round(subTotal * 0.05 * 100) / 100; // 5% CGST/SGST
    const total = Math.max(0, subTotal + tax - parseFloat(discount || 0));
    return { subTotal, tax, total };
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (billItems.length === 0) {
      alert("Please add at least one item to generate a bill.");
      return;
    }

    const pat = patients.find((p) => p.id === patientId) || { name: 'Walk-In Patient' };
    const { subTotal, tax, total } = calculateTotals();

    const newBill = addBill({
      patientId,
      patientName: pat.name,
      billType,
      doctorName,
      paymentMode,
      paymentStatus,
      items: billItems,
      subTotal,
      discount: parseFloat(discount || 0),
      tax,
      total
    });

    setIsCreateOpen(false);
    // Auto-open generated invoice for preview
    setSelectedBill(newBill);
    setIsInvoiceOpen(true);
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
      key: 'invoiceNo',
      header: 'Invoice No',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{row.invoiceNo}</span>
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">{row.patientName}</span>
          <span className="text-[10px] font-semibold text-slate-400 block">{row.patientId}</span>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Invoice Date',
      sortable: true,
      render: (row) => <span className="text-slate-400 font-semibold">{row.date}</span>
    },
    {
      key: 'billType',
      header: 'Type',
      render: (row) => (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
          row.billType === 'IPD' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-hospital-600 border border-blue-100'
        }`}>
          {row.billType}
        </span>
      )
    },
    {
      key: 'total',
      header: 'Total Amount',
      sortable: true,
      render: (row) => <span className="font-extrabold text-slate-800">₹{row.total}</span>
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => updateBillStatus(row.invoiceNo, row.paymentStatus === 'Paid' ? 'Pending' : 'Paid')}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border transition-all ${
            row.paymentStatus === 'Paid'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
          }`}
          title="Click to toggle status"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
          {row.paymentStatus}
        </button>
      )
    }
  ];

  const { subTotal: formSub, tax: formTax, total: formTotal } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-400 font-semibold">Audit invoice payments, calculate diagnostics costs, and print bills</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 self-start rounded-xl bg-gradient-to-r from-hospital-500 to-cyanic-500 px-4 py-2.5 text-sm font-bold text-white shadow-premium hover:shadow-premium-hover transition-all focus:outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>New Bill</span>
        </button>
      </div>

      {/* Invoices Table */}
      <Table
        columns={columns}
        data={bills}
        searchPlaceholder="Search invoices by patient name..."
        searchKey="patientName"
        emptyMessage="No billing invoices recorded"
        itemsPerPage={6}
        actions={(row) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenInvoice(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-hospital-600 transition-colors"
              title="View Invoice"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {/* Modal: Create Bill */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Generate New Invoice" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Treating Consultant</label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billing Scope</label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
              >
                <option value="OPD">OPD Consultation</option>
                <option value="IPD">IPD Admission</option>
                <option value="Pharmacy">Pharmacy</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Bill Items</h4>
            
            {/* Adding item row */}
            <div className="grid gap-3 sm:grid-cols-4 items-end bg-slate-50 p-3 rounded-xl border mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Item / Service Description</label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Knee Splint Charge"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Item Cost (₹)</label>
                <input
                  type="number"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  placeholder="₹ Rate"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addItemToBill}
                className="w-full rounded-lg bg-hospital-500 py-2 text-xs font-bold text-white hover:bg-hospital-600 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Bill items table preview */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="px-4 py-2 text-slate-400 font-bold">Item Description</th>
                    <th className="px-4 py-2 text-slate-400 font-bold text-right">Cost (₹)</th>
                    <th className="px-4 py-2 text-slate-400 font-bold text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 font-semibold text-slate-700">{item.description}</td>
                      <td className="px-4 py-2 font-bold text-slate-700 text-right">₹{item.amount}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemFromBill(idx)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {billItems.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-slate-400">No items added to invoice yet.</td>
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
                >
                  <option value="UPI">UPI / Net Banking</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card Swap</option>
                  <option value="Insurance Claim">Insurance Claim</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subtotal calculation box */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span>Sub Total:</span>
                <span className="text-slate-800">₹{formSub}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5% CGST/SGST):</span>
                <span className="text-slate-800">₹{formTax}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>Discount Applied:</span>
                <span>-₹{discount || 0}</span>
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
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-hospital-500 text-sm font-bold text-white shadow-premium hover:bg-hospital-600"
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
            {/* Printable Frame Area */}
            <div className="border rounded-2xl p-6 md:p-8 bg-white shadow-inner select-text">
              {/* Header Branding */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-hospital-500 to-cyanic-400 text-white shadow-premium">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 leading-none">RAJAHMUNDRY ORTHOPEDIC</h2>
                    <span className="text-[10px] font-bold text-hospital-600 tracking-wider uppercase">Hospital Management System</span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <h4 className="text-base font-bold text-slate-800">TAX INVOICE</h4>
                  <p className="text-xs text-slate-400 font-semibold">Invoice No: <span className="text-slate-700 font-bold">{selectedBill.invoiceNo}</span></p>
                  <p className="text-xs text-slate-400 font-semibold">Date: {selectedBill.date}</p>
                </div>
              </div>

              {/* Patient details block */}
              <div className="grid gap-6 sm:grid-cols-2 py-6 border-b text-xs font-semibold text-slate-600">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Patient Details</span>
                  <p className="text-sm font-bold text-slate-800">{selectedBill.patientName}</p>
                  <p>ID: {selectedBill.patientId}</p>
                  <p>Scope: {selectedBill.billType} Admission</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Consultation Details</span>
                  <p className="text-sm font-bold text-slate-800">{selectedBill.doctorName}</p>
                  <p>Payment Mode: {selectedBill.paymentMode}</p>
                  <p>Payment Status: <span className="font-extrabold text-emerald-600">{selectedBill.paymentStatus}</span></p>
                </div>
              </div>

              {/* Items Table details */}
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

              {/* Calculations Block */}
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
                  <span className="text-hospital-600">₹{selectedBill.total}</span>
                </div>
              </div>
            </div>

            {/* Print trigger actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInvoiceOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close Receipt
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="px-4 py-2 rounded-xl bg-slate-800 text-sm font-bold text-white hover:bg-slate-900 shadow-premium flex items-center gap-1.5"
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
