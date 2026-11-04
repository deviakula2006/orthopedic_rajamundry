import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import apiClient from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InvoiceModal = ({ isOpen, onClose, bill }) => {
  const { hospitalSettings } = useHospital();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [billData, setBillData] = useState(null);

  const gstRate = Number(hospitalSettings?.gstRate ?? 0);

  useEffect(() => {
    if (!isOpen || !bill) return;

    const billLookupId = bill.dbId || bill.id || bill.invoiceNo;
    if (!billLookupId) return;

    let active = true;

    // Fetch full bill from database
    apiClient
      .get(`/bills/${billLookupId}`)
      .then((res) => {
        if (!active) return;
        const fullBill = res.data?.data;
        if (fullBill) {
          setBillData({
            invoiceNo: fullBill.invoiceNo || bill.invoiceNo,
            dbId: fullBill.id || bill.id,
            date: fullBill.billDate || bill.date,
            billType:
              fullBill.billType === 'OPD'
                ? 'Consultation'
                : fullBill.billType === 'Lab'
                ? 'Investigations'
                : fullBill.billType || bill.billType,
            patientId: fullBill.patient?.code || bill.patientId || '—',
            patientName: fullBill.patient?.name || bill.patientName || '—',
            doctorName: fullBill.doctor?.name || bill.doctorName || 'Hospital Consultant',
            paymentMode: fullBill.paymentMode || bill.paymentMode || 'UPI',
            paymentStatus: fullBill.paymentStatus || bill.paymentStatus || 'Paid',
            subTotal: Number(fullBill.subTotal ?? bill.subTotal ?? bill.total ?? 0),
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
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load invoice details:', err);
        if (!bill.items || bill.items.length === 0) {
          setError('Unable to fetch detailed line items from the database.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, bill]);

  const handleClose = () => {
    setBillData(null);
    setError('');
    onClose?.();
  };

  const activeBill = billData || bill;

  const handleDownloadPdf = () => {
    if (!activeBill) return;
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
      doc.text(`Invoice No: ${activeBill.invoiceNo}`, 135, 24);
      doc.text(`Date: ${activeBill.date || ''}`, 135, 29);

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
      doc.text(`Name: ${activeBill.patientName || '—'}`, 14, 48);
      doc.text(`Patient ID: ${activeBill.patientId || '—'}`, 14, 53);
      doc.text(`Scope: ${activeBill.billType || activeBill.category || 'Hospital Services'}`, 14, 58);

      doc.text(`Treating Doctor: ${activeBill.doctorName || 'Hospital Consultant'}`, 110, 48);
      doc.text(`Payment Mode: ${activeBill.paymentMode || 'N/A'}`, 110, 53);
      doc.text(`Payment Status: ${activeBill.paymentStatus || 'Paid'}`, 110, 58);

      // Line Items Table
      const itemsList =
        activeBill.items && activeBill.items.length > 0
          ? activeBill.items
          : [
              {
                description: `${activeBill.billType || activeBill.category || 'General'} Services`,
                type: activeBill.billType || activeBill.category || 'Service',
                amount: activeBill.subTotal || activeBill.total
              }
            ];

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
      doc.text(`Sub Total: Rs. ${activeBill.subTotal ?? activeBill.total}`, 135, finalY + 10);
      if (activeBill.discount > 0) {
        doc.text(`Discount: -Rs. ${activeBill.discount}`, 135, finalY + 16);
      }
      doc.text(
        `GST (${gstRate}%): Rs. ${activeBill.tax ?? 0}`,
        135,
        finalY + (activeBill.discount > 0 ? 22 : 16)
      );
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(
        `Grand Total: Rs. ${activeBill.total}`,
        135,
        finalY + (activeBill.discount > 0 ? 30 : 24)
      );

      doc.save(`invoice-${activeBill.invoiceNo}.pdf`);
    } catch (err) {
      console.error('Invoice PDF export failed:', err);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  if (!isOpen || !activeBill) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Patient Tax Invoice" size="lg">
      <div className="space-y-6">
        <div
          className="p-6 border rounded-2xl bg-white shadow-xs print:border-none print:shadow-none"
          id="invoice-receipt"
        >
          {/* Hospital Header */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {hospitalSettings?.name || 'Rajahmundry Orthopedic Hospital'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {hospitalSettings?.address || 'Danavaipeta, Tilak Road, Rajahmundry, Andhra Pradesh, 533103'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Phone: {hospitalSettings?.contactPhone || '+91 883 244 5566'} | Reg:{' '}
                {hospitalSettings?.licenseNumber || 'AP-MED-ROH-2026-981'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-hospital-600 bg-hospital-50 border border-hospital-100 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Official Receipt
              </span>
              <p className="text-sm font-extrabold text-slate-800 mt-2 font-mono">
                {activeBill.invoiceNo}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{activeBill.date}</p>
            </div>
          </div>

          {/* Patient & Consultation Meta */}
          <div className="grid gap-6 sm:grid-cols-2 py-6 border-b text-xs font-semibold text-slate-600">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Patient Details
              </span>
              <p className="text-sm font-bold text-slate-800">{activeBill.patientName}</p>
              <p>ID: {activeBill.patientId}</p>
              <p>Scope: {activeBill.billType || activeBill.category || 'Hospital Services'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Consultation Details
              </span>
              <p className="text-sm font-bold text-slate-800">{activeBill.doctorName}</p>
              <p>Payment Mode: {activeBill.paymentMode || 'UPI'}</p>
              <p>
                Payment Status:{' '}
                <span
                  className={`font-extrabold ${
                    activeBill.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-500'
                  }`}
                >
                  {activeBill.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm font-semibold">
              <RefreshCw className="w-5 h-5 animate-spin text-hospital-500" />
              <span>Loading invoice details from database...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 my-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
                  {error}
                </div>
              )}

              {/* Line Items Table */}
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
                  {activeBill.items && activeBill.items.length > 0 ? (
                    activeBill.items.map((item, idx) => (
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
                      <td className="px-4 py-2.5">
                        {activeBill.billType || activeBill.category || 'Hospital'} Care & Service Fee
                      </td>
                      <td className="px-4 py-2.5">
                        {activeBill.billType || activeBill.category || 'Service'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        ₹{activeBill.subTotal || activeBill.total}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="flex flex-col items-end pt-4 border-t text-xs font-semibold text-slate-600 space-y-1.5">
                <div className="flex w-64 justify-between">
                  <span>Sub Total:</span>
                  <span className="text-slate-800">₹{activeBill.subTotal ?? activeBill.total}</span>
                </div>
                {activeBill.discount > 0 && (
                  <div className="flex w-64 justify-between text-red-500">
                    <span>Discount:</span>
                    <span>-₹{activeBill.discount}</span>
                  </div>
                )}
                <div className="flex w-64 justify-between">
                  <span>GST ({gstRate}%):</span>
                  <span className="text-slate-800">₹{activeBill.tax ?? 0}</span>
                </div>
                <div className="flex w-64 justify-between text-sm font-extrabold text-slate-800 border-t pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-hospital-600 font-bold text-base">₹{activeBill.total}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
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
            onClick={handleClose}
            className="rounded-xl bg-slate-900 hover:bg-black py-2.5 px-5 text-xs font-bold text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
