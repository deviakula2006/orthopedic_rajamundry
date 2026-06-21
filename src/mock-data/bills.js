export const INITIAL_BILLS = [
  {
    invoiceNo: 'INV-2026-001',
    patientId: 'PT001245',
    patientName: 'Ramesh Babu',
    date: '2026-06-21',
    billType: 'Consultation',
    doctorId: 'DOC001',
    doctorName: 'Dr. Arjun Kumar',
    appointmentId: 'APT001',
    paymentMode: 'Cash',
    paymentStatus: 'Paid',
    items: [
      { description: 'Consultation - Dr. Arjun Kumar', type: 'Consultation', amount: 500 }
    ],
    subTotal: 500,
    discount: 50,
    tax: 22.5,
    total: 472.5
  },
  {
    invoiceNo: 'INV-2026-002',
    patientId: 'PT001244',
    patientName: 'Anjali Kumari',
    date: '2026-06-21',
    billType: 'Investigations',
    doctorId: 'DOC002',
    doctorName: 'Dr. Priya Smith',
    appointmentId: 'APT002',
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    items: [
      { description: 'X-Ray - Knee AP/Lateral', type: 'Investigation', amount: 800 },
      { description: 'CBC (Complete Blood Count)', type: 'Investigation', amount: 450 }
    ],
    subTotal: 1250,
    discount: 100,
    tax: 57.5,
    total: 1207.5
  }
];
