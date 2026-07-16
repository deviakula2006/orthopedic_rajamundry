import * as reportsRepository from './reports.repository.js';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTrend(rows, valueKey) {
  return DAYS_OF_WEEK.map((day, index) => {
    const dow = index + 1; // 1 = Mon, 7 = Sun
    const match = rows.find((r) => r.dow === dow);
    return {
      day,
      [valueKey]: match ? Number(match[valueKey] || match.count || 0) : 0
    };
  });
}

export async function getRevenueReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getRevenueReport({ dateFrom, dateTo });
  return {
    totalCollected: data.totalCollected,
    trend: formatTrend(data.trend, 'revenue'),
    items: data.items.map((b) => ({
      invoiceNo: b.invoice_no,
      date: b.date,
      billType: b.bill_type === 'OPD' ? 'Consultation' : b.bill_type === 'Lab' ? 'Investigations' : b.bill_type,
      paymentStatus: b.payment_status,
      subTotal: Number(b.sub_total),
      discount: Number(b.discount),
      tax: Number(b.tax),
      total: Number(b.total),
      patientName: b.patient_name,
      doctorName: b.doctor_name || ''
    }))
  };
}

export async function getPatientsReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getPatientsReport({ dateFrom, dateTo });
  return {
    totalRegistrations: data.totalRegistrations,
    trend: formatTrend(data.trend, 'registrations'),
    items: data.items.map((p) => ({
      id: p.code,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      bloodGroup: p.bloodGroup,
      disease: p.diagnosis,
      lastVisit: p.registeredDate
    }))
  };
}

export async function getInvestigationsReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getInvestigationsReport({ dateFrom, dateTo });
  return {
    totalTestsOrdered: data.totalTestsOrdered,
    trend: formatTrend(data.trend, 'tests'),
    items: data.items.map((o) => ({
      id: o.code || 'INV000',
      testName: o.test_name,
      category: o.category || 'Pathology',
      price: Number(o.price),
      date: o.date,
      patientName: o.patient_name
    }))
  };
}
