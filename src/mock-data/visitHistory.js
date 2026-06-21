export const INITIAL_VISIT_HISTORY = [
  {
    patientId: 'PT001245',
    visits: [
      {
        id: 'VIS-2026-001',
        visitDate: '2026-06-21',
        appointmentId: 'APT001',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Consultation',
        billRefNo: 'INV-2026-001',
        vitals: [
          {
            time: '09:10 AM',
            bp: '120/80',
            sugar: '110',
            temp: '98.4',
            pulse: '72',
            weight: '70',
            height: '170',
            spo2: '98',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV001',
            testName: 'X-Ray - Knee AP/Lateral',
            orderedBy: 'Dr. Arjun Kumar',
            orderedDate: '2026-06-21',
            orderedTime: '09:30 AM',
            status: 'Completed'
          }
        ],
        prescriptions: [
          {
            medicineName: 'Paracetamol 650mg',
            dosage: '1 tablet',
            frequency: 'Twice Daily (1-0-1)',
            duration: '5 Days',
            notes: 'Take after meals',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '09:40 AM'
          }
        ],
        summary: {
          symptoms: 'Severe osteoarthritis pain in the right knee, swelling.',
          findings: 'Joint space narrowing, tenderness over medial joint line.',
          diagnosis: 'Osteoarthritis Grade-2',
          advice: 'Physiotherapy sessions, avoid climbing stairs.',
          followUp: 'Review in 15 days',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '09:45 AM'
        }
      },
      {
        id: 'VIS-2026-002',
        visitDate: '2026-06-12',
        appointmentId: 'APT000',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Follow Up',
        billRefNo: 'INV-2026-000',
        vitals: [
          {
            time: '10:15 AM',
            bp: '120/80',
            sugar: '95',
            temp: '98.4',
            pulse: '70',
            weight: '70',
            height: '170',
            spo2: '98',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-12'
          }
        ],
        investigations: [],
        prescriptions: [
          {
            medicineName: 'Tab. Zerodol-SP',
            dosage: '1 tablet',
            frequency: 'Twice Daily (1-0-1)',
            duration: '3 Days',
            notes: 'Take after meals',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-12',
            time: '10:30 AM'
          }
        ],
        summary: {
          symptoms: 'Mild right knee soreness and pain.',
          findings: 'Mild joint effusion, no obvious structural damage.',
          diagnosis: 'Early osteoarthritis knee',
          advice: 'Heat compression, avoid strenuous kneeling.',
          followUp: 'Review after 10 days',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-12',
          time: '10:45 AM'
        }
      }
    ]
  },
  {
    patientId: 'PT001244',
    visits: [
      {
        id: 'VIS-2026-003',
        visitDate: '2026-06-21',
        appointmentId: 'APT002',
        doctorName: 'Dr. Priya Smith',
        doctorId: 'DOC002',
        appointmentType: 'Therapy',
        billRefNo: 'INV-2026-002',
        vitals: [
          {
            time: '11:05 AM',
            bp: '115/75',
            sugar: '90',
            temp: '98.6',
            pulse: '68',
            weight: '58',
            height: '162',
            spo2: '99',
            addedBy: 'Dr. Priya Smith',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV002',
            testName: 'CBC (Complete Blood Count)',
            orderedBy: 'Dr. Priya Smith',
            orderedDate: '2026-06-21',
            orderedTime: '11:20 AM',
            status: 'Completed'
          }
        ],
        prescriptions: [],
        summary: {
          symptoms: 'ACL sprain rehabilitation, recovering flexion range.',
          findings: 'No joint instability, improving quadriceps control.',
          diagnosis: 'ACL Sprain recovery status',
          advice: 'Calf stretches and straight leg raises daily.',
          followUp: 'Continue weekly rehab',
          addedBy: 'Dr. Priya Smith',
          date: '2026-06-21',
          time: '11:30 AM'
        }
      }
    ]
  },
  {
    patientId: 'PT001243',
    visits: [
      {
        id: 'VIS-2026-004',
        visitDate: '2026-06-21',
        appointmentId: 'APT003',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Consultation',
        billRefNo: 'INV-2026-003',
        vitals: [
          {
            time: '09:20 AM',
            bp: '130/80',
            sugar: '120',
            temp: '98.6',
            pulse: '76',
            weight: '75',
            height: '165',
            spo2: '97',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV003',
            testName: 'X-Ray - Pelvis AP/Lateral',
            orderedBy: 'Dr. Arjun Kumar',
            orderedDate: '2026-06-21',
            orderedTime: '09:40 AM',
            status: 'Completed'
          }
        ],
        prescriptions: [
          {
            medicineName: 'Tab. Tramadol 50mg',
            dosage: '1 tablet',
            frequency: 'Once Daily (1-0-0)',
            duration: '3 Days',
            notes: 'Take at night if pain is severe',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '09:50 AM'
          }
        ],
        summary: {
          symptoms: 'Severe left hip pain after falling in bathroom, inability to bear weight.',
          findings: 'Tenderness over greater trochanter, external rotation of left leg.',
          diagnosis: 'Left Hip Fracture',
          advice: 'Emergency ward admission. Keep patient immobilized.',
          followUp: 'Scheduled orthopedic surgery tomorrow',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '09:55 AM'
        }
      }
    ]
  },
  {
    patientId: 'PT001242',
    visits: [
      {
        id: 'VIS-2026-005',
        visitDate: '2026-06-21',
        appointmentId: 'APT007',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Follow Up',
        billRefNo: 'INV-2026-004',
        vitals: [
          {
            time: '12:05 PM',
            bp: '110/70',
            sugar: '90',
            temp: '98.4',
            pulse: '72',
            weight: '62',
            height: '158',
            spo2: '99',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV004',
            testName: 'Nerve Conduction Study',
            orderedBy: 'Dr. Arjun Kumar',
            orderedDate: '2026-06-21',
            orderedTime: '12:15 PM',
            status: 'Completed'
          }
        ],
        prescriptions: [
          {
            medicineName: 'Tab. Methylcobalamin 1500mcg',
            dosage: '1 tablet',
            frequency: 'Once Daily (1-0-0)',
            duration: '30 Days',
            notes: 'Take after breakfast',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '12:20 PM'
          }
        ],
        summary: {
          symptoms: 'Numbness and tingling sensation in thumb and index finger.',
          findings: 'Positive Phalen maneuver and Tinel sign in right wrist.',
          diagnosis: 'Carpal Tunnel Syndrome',
          advice: 'Wear neutral wrist splint at night. Avoid repetitive hand strains.',
          followUp: 'Review in 2 weeks',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '12:25 PM'
        }
      }
    ]
  },
  {
    patientId: 'PT001241',
    visits: [
      {
        id: 'VIS-2026-006',
        visitDate: '2026-06-21',
        appointmentId: 'APT005',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Consultation',
        billRefNo: 'INV-2026-005',
        vitals: [
          {
            time: '11:35 AM',
            bp: '135/85',
            sugar: '125',
            temp: '98.6',
            pulse: '78',
            weight: '82',
            height: '178',
            spo2: '98',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV005',
            testName: 'MRI Spine - Lumbo-sacral',
            orderedBy: 'Dr. Arjun Kumar',
            orderedDate: '2026-06-21',
            orderedTime: '11:45 AM',
            status: 'Completed'
          }
        ],
        prescriptions: [
          {
            medicineName: 'Tab. Pregabalin 75mg',
            dosage: '1 tablet',
            frequency: 'Once Daily (0-0-1)',
            duration: '10 Days',
            notes: 'Take before bedtime',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '11:50 AM'
          }
        ],
        summary: {
          symptoms: 'Radiating pain from lower back to left calf, numbness.',
          findings: 'SLR positive at 45 degrees on left side.',
          diagnosis: 'Lumbar Spondylosis with Sciatica',
          advice: 'Lumbar traction therapy. Avoid forward bending.',
          followUp: 'Review in 10 days',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '11:55 AM'
        }
      }
    ]
  },
  {
    patientId: 'PT001240',
    visits: [
      {
        id: 'VIS-2026-007',
        visitDate: '2026-06-21',
        appointmentId: 'APT008',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Consultation',
        billRefNo: 'INV-2026-006',
        vitals: [
          {
            time: '12:35 PM',
            bp: '120/80',
            sugar: '105',
            temp: '98.2',
            pulse: '74',
            weight: '78',
            height: '172',
            spo2: '98',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [
          {
            testId: 'INV006',
            testName: 'X-Ray - Shoulder AP',
            orderedBy: 'Dr. Arjun Kumar',
            orderedDate: '2026-06-21',
            orderedTime: '12:45 PM',
            status: 'Completed'
          }
        ],
        prescriptions: [
          {
            medicineName: 'Tab. Etoricoxib 90mg',
            dosage: '1 tablet',
            frequency: 'Once Daily (1-0-0)',
            duration: '5 Days',
            notes: 'Take after breakfast',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '12:50 PM'
          }
        ],
        summary: {
          symptoms: 'Stiffness and severe pain in right shoulder, restricted rotation.',
          findings: 'Painful arc of abduction, passive movement restricted.',
          diagnosis: 'Frozen Shoulder',
          advice: 'Gentle stretching, shoulder pendulum exercises.',
          followUp: 'Review after 1 week',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '12:55 PM'
        }
      }
    ]
  },
  {
    patientId: 'PT001239',
    visits: [
      {
        id: 'VIS-2026-008',
        visitDate: '2026-06-21',
        appointmentId: 'APT009',
        doctorName: 'Dr. Arjun Kumar',
        doctorId: 'DOC001',
        appointmentType: 'Follow Up',
        billRefNo: 'INV-2026-007',
        vitals: [
          {
            time: '01:05 PM',
            bp: '118/76',
            sugar: '95',
            temp: '98.6',
            pulse: '70',
            weight: '55',
            height: '160',
            spo2: '99',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21'
          }
        ],
        investigations: [],
        prescriptions: [
          {
            medicineName: 'Tab. Zerodol-SP',
            dosage: '1 tablet',
            frequency: 'Twice Daily (1-0-1)',
            duration: '3 Days',
            notes: 'Take after food',
            addedBy: 'Dr. Arjun Kumar',
            date: '2026-06-21',
            time: '01:15 PM'
          }
        ],
        summary: {
          symptoms: 'Swelling and bruising on lateral side of left ankle after misstepping.',
          findings: 'Mild swelling over lateral malleolus, no bone crepitus.',
          diagnosis: 'Grade-1 Ankle Sprain',
          advice: 'R.I.C.E protocol. Use ankle compression binder.',
          followUp: 'Review after 5 days',
          addedBy: 'Dr. Arjun Kumar',
          date: '2026-06-21',
          time: '01:20 PM'
        }
      }
    ]
  }
];
