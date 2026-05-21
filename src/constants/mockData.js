export const INITIAL_PATIENTS = [
  { id: 'PT001245', name: 'Ramesh Babu', age: 45, gender: 'Male', phone: '9876543210', lastVisit: '12 May 2026', address: 'Rajahmundry, Danavaipeta', bloodGroup: 'O+', disease: 'Osteoarthritis Knee' },
  { id: 'PT001244', name: 'Anjali Kumari', age: 29, gender: 'Female', phone: '9551224567', lastVisit: '11 May 2026', address: 'Rajahmundry, Tilak Road', bloodGroup: 'B+', disease: 'Ligament Tear ACL' },
  { id: 'PT001243', name: 'Mohan Rao', age: 60, gender: 'Male', phone: '9701122334', lastVisit: '10 May 2026', address: 'Kakinada, Bhanugudi', bloodGroup: 'A+', disease: 'Hip Fracture' },
  { id: 'PT001242', name: 'Kanya Sree', age: 38, gender: 'Female', phone: '7034561230', lastVisit: '09 May 2026', address: 'Rajahmundry, Lalacheruvu', bloodGroup: 'AB+', disease: 'Carpal Tunnel Syndrome' },
  { id: 'PT001241', name: 'Srinivas Reddy', age: 52, gender: 'Male', phone: '9911223344', lastVisit: '08 May 2026', address: 'Ravulapalem, Main Bazar', bloodGroup: 'O-', disease: 'Lumbar Spondylosis' },
  { id: 'PT001240', name: 'Prasad Rao', age: 47, gender: 'Male', phone: '9392828282', lastVisit: '06 May 2026', address: 'Rajahmundry, Morampudi', bloodGroup: 'A-', disease: 'Frozen Shoulder' },
  { id: 'PT001239', name: 'Lalitha Kumari', age: 34, gender: 'Female', phone: '7282828292', lastVisit: '05 May 2026', address: 'Dowleswaram, Temple Rd', bloodGroup: 'B-', disease: 'Ankle Sprain' }
];

export const INITIAL_DOCTORS = [
  { id: 'DOC001', name: 'Dr. Arjun Kumar', specialization: 'Orthopedic Surgeon', phone: '9810543210', status: 'Active', availability: '9:00 AM - 1:00 PM', experience: '15 Years', email: 'arjun.kumar@roh.com' },
  { id: 'DOC002', name: 'Dr. Priya Smith', specialization: 'Physiotherapist', phone: '9845123412', status: 'Active', availability: '2:00 PM - 6:00 PM', experience: '8 Years', email: 'priya.smith@roh.com' },
  { id: 'DOC003', name: 'Dr. Ravi Teja', specialization: 'Anesthesiologist', phone: '9900112233', status: 'Active', availability: 'On Call', experience: '12 Years', email: 'ravi.teja@roh.com' },
  { id: 'DOC004', name: 'Dr. Sunitha Devi', specialization: 'Radiologist', phone: '9867708554', status: 'Inactive', availability: '10:00 AM - 2:00 PM', experience: '10 Years', email: 'sunitha.devi@roh.com' },
  { id: 'DOC005', name: 'Dr. Mahesh Babu', specialization: 'General Physician', phone: '9700334455', status: 'Active', availability: '8:00 AM - 12:00 PM', experience: '9 Years', email: 'mahesh.babu@roh.com' }
];

export const INITIAL_RECEPTIONISTS = [
  { id: 'REC001', name: 'Laxmi Kumari', phone: '9123456789', status: 'Active', shift: 'Morning (8 AM - 4 PM)', email: 'laxmi.k@roh.com' },
  { id: 'REC002', name: 'Kishore Kumar', phone: '9876543219', status: 'Active', shift: 'Night (4 PM - 12 AM)', email: 'kishore.k@roh.com' }
];

export const INITIAL_INVESTIGATIONS = [
  { id: 'INV001', testName: 'X-Ray - Knee AP/Lateral', category: 'Radiology', price: 800 },
  { id: 'INV002', testName: 'CBC (Complete Blood Count)', category: 'Pathology', price: 450 },
  { id: 'INV003', testName: 'ECG', category: 'Cardiology', price: 350 },
  { id: 'INV004', testName: 'Blood Sugar (Fasting)', category: 'Pathology', price: 150 },
  { id: 'INV005', testName: 'MRI - Knee', category: 'Radiology', price: 5500 },
  { id: 'INV006', testName: 'CT Scan - Spine', category: 'Radiology', price: 4500 },
  { id: 'INV007', testName: 'Vitamin D3', category: 'Pathology', price: 1200 }
];

export const INITIAL_APPOINTMENTS = [
  { id: 'APT001', patientId: 'PT001245', patientName: 'Ramesh Babu', doctorId: 'DOC001', doctorName: 'Dr. Arjun Kumar', date: '2026-05-22', time: '10:30 AM', type: 'Consultation', status: 'Scheduled', fee: 500 },
  { id: 'APT002', patientId: 'PT001244', patientName: 'Anjali Kumari', doctorId: 'DOC002', doctorName: 'Dr. Priya Smith', date: '2026-05-22', time: '11:00 AM', type: 'Therapy', status: 'Scheduled', fee: 600 },
  { id: 'APT003', patientId: 'PT001243', patientName: 'Mohan Rao', doctorId: 'DOC001', doctorName: 'Dr. Arjun Kumar', date: '2026-05-21', time: '09:30 AM', type: 'Consultation', status: 'Completed', fee: 500 },
  { id: 'APT004', patientId: 'PT001242', patientName: 'Kanya Sree', doctorId: 'DOC005', doctorName: 'Dr. Mahesh Babu', date: '2026-05-21', time: '10:00 AM', type: 'Follow Up', status: 'Completed', fee: 300 },
  { id: 'APT005', patientId: 'PT001241', patientName: 'Srinivas Reddy', doctorId: 'DOC001', doctorName: 'Dr. Arjun Kumar', date: '2026-05-23', time: '11:30 AM', type: 'Consultation', status: 'Scheduled', fee: 500 }
];

export const INITIAL_BEDS = [
  // General Ward (101 - 105)
  { bedNo: '101', ward: 'General Ward', bedType: 'General', patientId: 'PT001245', patientName: 'Ramesh Babu', status: 'Occupied' },
  { bedNo: '102', ward: 'General Ward', bedType: 'General', patientId: '', patientName: '', status: 'Available' },
  { bedNo: '103', ward: 'General Ward', bedType: 'General', patientId: 'PT001242', patientName: 'Kanya Sree', status: 'Occupied' },
  { bedNo: '104', ward: 'General Ward', bedType: 'General', patientId: '', patientName: '', status: 'Available' },
  { bedNo: '105', ward: 'General Ward', bedType: 'General', patientId: '', patientName: '', status: 'Available' },
  // Semi Private (201 - 203)
  { bedNo: '201', ward: 'Semi Private', bedType: 'Semi-Private', patientId: '', patientName: '', status: 'Available' },
  { bedNo: '202', ward: 'Semi Private', bedType: 'Semi-Private', patientId: '', patientName: '', status: 'Available' },
  { bedNo: '203', ward: 'Semi Private', bedType: 'Semi-Private', patientId: 'PT001244', patientName: 'Anjali Kumari', status: 'Occupied' },
  // Private Room (301 - 302)
  { bedNo: '301', ward: 'Private Room', bedType: 'Private Suite', patientId: 'PT001243', patientName: 'Mohan Rao', status: 'Occupied' },
  { bedNo: '302', ward: 'Private Room', bedType: 'Private Suite', patientId: '', patientName: '', status: 'Available' },
  // ICU (401 - 402)
  { bedNo: '401', ward: 'ICU', bedType: 'Critical Care', patientId: '', patientName: '', status: 'Available' },
  { bedNo: '402', ward: 'ICU', bedType: 'Critical Care', patientId: '', patientName: '', status: 'Available' }
];

export const INITIAL_BILLS = [
  {
    invoiceNo: 'INV-2026-001',
    patientId: 'PT001245',
    patientName: 'Ramesh Babu',
    date: '2026-05-20',
    billType: 'OPD',
    doctorName: 'Dr. Arjun Kumar',
    paymentMode: 'Cash',
    paymentStatus: 'Paid',
    items: [
      { description: 'Consultation - Dr. Arjun Kumar', type: 'Consultation', amount: 500 },
      { description: 'X-Ray - Knee AP/Lateral', type: 'Investigation', amount: 800 },
      { description: 'Physiotherapy Session', type: 'Therapy', amount: 600 },
      { description: 'Medicine Kit', type: 'Pharmacy', amount: 350 }
    ],
    subTotal: 2250,
    discount: 100,
    tax: 112.5,
    total: 2262.5
  },
  {
    invoiceNo: 'INV-2026-002',
    patientId: 'PT001244',
    patientName: 'Anjali Kumari',
    date: '2026-05-21',
    billType: 'OPD',
    doctorName: 'Dr. Priya Smith',
    paymentMode: 'UPI',
    paymentStatus: 'Paid',
    items: [
      { description: 'Consultation - Dr. Priya Smith', type: 'Consultation', amount: 600 },
      { description: 'CBC (Complete Blood Count)', type: 'Investigation', amount: 450 }
    ],
    subTotal: 1050,
    discount: 50,
    tax: 50,
    total: 1050
  }
];

export const INITIAL_ACTIVITIES = [
  { id: 'ACT001', user: 'Admin', action: 'Approved appointment for Ramesh Babu', time: '10 mins ago', type: 'appointment' },
  { id: 'ACT002', user: 'Receptionist Laxmi', action: 'Registered new patient Anjali Kumari', time: '45 mins ago', type: 'patient' },
  { id: 'ACT003', user: 'Admin', action: 'Generated invoice INV-2026-002', time: '2 hours ago', type: 'billing' },
  { id: 'ACT004', user: 'Dr. Arjun Kumar', action: 'Marked Mohan Rao checkup as complete', time: '3 hours ago', type: 'medical' },
  { id: 'ACT005', user: 'Admin', action: 'Assigned bed 101 to Ramesh Babu', time: '4 hours ago', type: 'bed' }
];
