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
    summary: data.summary,
    trend: formatTrend(data.trend, 'revenue'),
    items: data.items.map((b) => ({
      id: b.id,
      invoiceNo: b.invoiceNo,
      patientId: b.patientId,
      patientName: b.patientName,
      doctorName: b.doctorName || '—',
      date: b.date,
      dateTime: b.dateTime,
      billType: b.billType === 'OPD' ? 'Consultation' : b.billType === 'Lab' ? 'Investigations' : b.billType,
      category: b.category,
      paymentStatus: b.paymentStatus,
      paymentMode: b.paymentMode,
      subTotal: Number(b.subTotal),
      discount: Number(b.discount),
      tax: Number(b.tax),
      total: Number(b.total),
      consultationAmount: Number(b.consultationAmount),
      investigationAmount: Number(b.investigationAmount)
    }))
  };
}

export async function getPatientsReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getPatientsReport({ dateFrom, dateTo });
  return {
    totalRegistrations: data.totalRegistrations,
    summary: data.summary,
    trend: formatTrend(data.trend, 'registrations'),
    items: data.items.map((p) => ({
      id: p.code,
      uuid: p.id,
      code: p.code,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      bloodGroup: p.bloodGroup,
      disease: p.diagnosis,
      diagnosis: p.diagnosis,
      assignedDoctor: p.assigned_doctor,
      registeredDate: p.registeredDate,
      lastVisit: p.registeredDate,
      createdAt: p.created_at
    }))
  };
}

export async function getInvestigationsReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getInvestigationsReport({ dateFrom, dateTo });
  return {
    totalTestsOrdered: data.totalTestsOrdered,
    totalCollected: data.totalCollected ?? 0,
    summary: data.summary,
    trend: formatTrend(data.trend, 'tests'),
    items: data.items.map((b) => ({
      id: b.id,
      invoiceNo: b.invoiceNo,
      patientId: b.patientId,
      patientName: b.patientName,
      investigationName: b.investigationName,
      testName: b.investigationName, // backward-compat with any test or export
      date: b.date,
      dateTime: b.dateTime,
      investigationAmount: Number(b.investigationAmount),
      price: Number(b.investigationAmount), // backward-compat
      totalAmount: Number(b.totalAmount),
      total: Number(b.totalAmount),
      paymentStatus: b.paymentStatus,
      paymentMode: b.paymentMode
    }))
  };
}

export async function getConsultationsReport({ dateFrom, dateTo }) {
  const data = await reportsRepository.getConsultationsReport({ dateFrom, dateTo });
  return {
    totalCollected: data.totalCollected,
    summary: data.summary,
    trend: formatTrend(data.trend, 'revenue'),
    items: data.items.map((b) => ({
      id: b.id,
      invoiceNo: b.invoiceNo,
      patientId: b.patientId,
      patientName: b.patientName,
      doctorName: b.doctorName || 'Hospital Consultant',
      consultationType: b.consultationType,
      date: b.date,
      dateTime: b.dateTime,
      billType: b.billType,
      paymentStatus: b.paymentStatus,
      paymentMode: b.paymentMode,
      subTotal: Number(b.subTotal),
      discount: Number(b.discount),
      tax: Number(b.tax),
      total: Number(b.total),
      consultationRevenue: Number(b.consultationRevenue),
      consultationAmount: Number(b.consultationRevenue)
    }))
  };
}
