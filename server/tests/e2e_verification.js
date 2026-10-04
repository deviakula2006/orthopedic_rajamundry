const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('--- Starting API E2E Verification ---');

  // 1. Admin Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin@123' })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.token;
  console.log('✓ Admin login successful');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch Hospital Settings & GST
  const settingsRes = await fetch(`${BASE_URL}/hospital-settings`, { headers: authHeaders });
  const settingsData = await settingsRes.json();
  console.log('✓ Hospital Settings GST Rate:', settingsData.data.gstRate);

  // 3. Fetch Appointment Types
  const aptTypesRes = await fetch(`${BASE_URL}/appointment-types`, { headers: authHeaders });
  const aptTypesData = await aptTypesRes.json();
  console.log(`✓ Appointment Types found: ${aptTypesData.data.length}`);
  const firstAptType = aptTypesData.data[0];
  console.log('  Sample type:', firstAptType?.name, 'fee:', firstAptType?.defaultFee);

  // 4. Test Past Date/Time validation on Appointment Creation
  // Get current IST time
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = istFormatter.formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;
  const todayIST = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const currentHour = parseInt(getPart('hour'), 10);
  const currentMin = parseInt(getPart('minute'), 10);

  // Fetch doctors and patients to get valid IDs
  const docRes = await fetch(`${BASE_URL}/doctors`, { headers: authHeaders });
  const docData = await docRes.json();
  const doctor = docData.data[0];

  const patRes = await fetch(`${BASE_URL}/patients`, { headers: authHeaders });
  const patData = await patRes.json();
  const patient = patData.data[0];

  console.log(`Testing with Doctor: ${doctor.name} (${doctor.id}), Patient: ${patient.name} (${patient.id})`);

  // Past time today (01:00 AM IST)
  const pastRes = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: todayIST,
      appointmentTime: '01:00 AM',
      type: 'Checkup',
      patientType: 'Outpatient'
    })
  });
  const pastData = await pastRes.json();
  if (pastRes.status === 400 && pastData.error?.message?.includes('later than current time')) {
    console.log('✓ Past time today was correctly rejected with 400:', pastData.error.message);
  } else {
    console.error('✗ Expected 400 rejection for past time, got:', pastRes.status, pastData);
  }

  // Future time: use random future minute to avoid collision
  const randomMin = Math.floor(Math.random() * 50) + 10;
  const futureTime = `11:${randomMin.toString().padStart(2, '0')} PM`;
  const validAptRes = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate: todayIST,
      appointmentTime: futureTime,
      type: firstAptType?.name || 'Consultation',
      appointmentTypeId: firstAptType?.id,
      patientType: 'Inpatient',
      fee: firstAptType?.defaultFee || 500
    })
  });
  const validAptData = await validAptRes.json();
  if (validAptRes.status === 201) {
    console.log('✓ Valid future appointment booked successfully with ID:', validAptData.data.id, 'Patient Type:', validAptData.data.patientType);
  } else {
    console.error('✗ Booking future appointment failed:', validAptRes.status, validAptData);
  }

  const createdAppointment = validAptData.data;

  // 5. Vitals validation: BP is mandatory, other vitals optional
  // Test missing BP
  const noBpRes = await fetch(`${BASE_URL}/consultations/vitals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientId: patient.id,
      appointmentId: createdAppointment?.id,
      pulse: 72,
      temperature: 98.6
    })
  });
  const noBpData = await noBpRes.json();
  if (noBpRes.status === 400) {
    console.log('✓ Missing BP was correctly rejected with 400:', noBpData.error?.message || noBpData.error?.details);
  } else {
    console.error('✗ Expected 400 for missing BP, got:', noBpRes.status, noBpData);
  }

  // Test BP only (all other vitals blank / omitted)
  const bpOnlyRes = await fetch(`${BASE_URL}/consultations/vitals`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientId: patient.id,
      appointmentId: createdAppointment?.id,
      bpText: '120/80',
      bpSystolic: 120,
      bpDiastolic: 80
    })
  });
  const bpOnlyData = await bpOnlyRes.json();
  if (bpOnlyRes.status === 201) {
    console.log('✓ Vitals with BP only saved successfully! ID:', bpOnlyData.data.id);
  } else {
    console.error('✗ Vitals with BP only failed:', bpOnlyRes.status, bpOnlyData);
  }

  // 6. Test Billing with dynamic GST
  // Update GST to 12% to test dynamic computation
  const updateGstRes = await fetch(`${BASE_URL}/hospital-settings`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      gstRate: 12.0
    })
  });
  const updateGstData = await updateGstRes.json();
  console.log('✓ Updated GST rate in hospital-settings to 12%:', updateGstData.data?.gstRate);

  const billRes = await fetch(`${BASE_URL}/bills`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      patientId: patient.id,
      doctorId: doctor.id,
      billType: 'OPD',
      items: [
        { description: 'Initial Consultation', itemType: 'Consultation', quantity: 1, amount: 1000 }
      ],
      discount: 0
    })
  });
  const billData = await billRes.json();
  if (billRes.status === 201) {
    const bill = billData.data;
    console.log(`✓ Bill created. Subtotal: ${bill.subtotal}, Tax: ${bill.tax} (expected 120), Total: ${bill.totalAmount} (expected 1120)`);
    if (Number(bill.tax) === 120 && Number(bill.totalAmount) === 1120) {
      console.log('✓ GST dynamic calculation matches 12% exactly!');
    }
  } else {
    console.error('✗ Bill creation failed:', billRes.status, billData);
  }

  // Reset GST to 0% (standard default)
  await fetch(`${BASE_URL}/hospital-settings`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ gstRate: 0.0 })
  });
  console.log('✓ Reset GST rate back to 0%');

  console.log('--- API E2E Verification Complete ---');
}

testAll().catch(err => {
  console.error('E2E verification error:', err);
  process.exit(1);
});
