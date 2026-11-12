import { withTransaction } from '../../config/db.js';
import * as billsRepository from './bills.repository.js';
import * as patientsRepository from '../patients/patients.repository.js';
import * as doctorsRepository from '../doctors/doctors.repository.js';
import * as hospitalSettingsRepository from '../hospitalSettings/hospitalSettings.repository.js';
import { serializeBill } from './bills.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';

export async function listBills({ page, limit, offset, patientId, paymentStatus, billType }) {
  const { rows, total } = await billsRepository.list({ limit, offset, patientId, paymentStatus, billType });
  return { items: rows.map((row) => serializeBill(row)), meta: buildMeta({ page, limit, total }) };
}

export async function getBill(id) {
  const row = await billsRepository.findById(id);
  if (!row) throw ApiError.notFound('Bill not found');
  const items = await billsRepository.listItems(id);
  return serializeBill(row, items);
}

export async function getPendingInvestigations(patientId) {
  if (!patientId) throw ApiError.badRequest('Patient ID is required');
  const patient = await patientsRepository.findById(patientId);
  if (!patient) throw ApiError.notFound('Patient not found');
  const rows = await billsRepository.getPendingInvestigations(patientId);
  return rows.map((r) => ({
    id: r.id,
    orderId: r.id,
    consultationId: r.consultation_id,
    patientId: r.patient_id,
    investigationId: r.investigation_id,
    investigationCode: r.investigation_code,
    testName: r.test_name,
    category: r.category,
    price: Number(r.price),
    clinicalStatus: r.clinical_status,
    billingStatus: r.billing_status || 'Unbilled',
    orderedAt: r.ordered_at,
    orderedBy: r.ordered_by
  }));
}

export async function createBill(data, actor) {
  const { items, discount = 0 } = data;

  const patient = await patientsRepository.findById(data.patientId);
  if (!patient) throw ApiError.notFound('Patient not found');

  if (data.doctorId) {
    const doctor = await doctorsRepository.findById(data.doctorId);
    if (!doctor) throw ApiError.notFound('Doctor not found');
  }

  // Identify any linked investigation orders
  const invOrderItems = items.filter(
    (it) => it.consultationInvestigationId || (it.itemType === 'Investigation' && it.orderId)
  );
  const invOrderIds = invOrderItems.map(
    (it) => it.consultationInvestigationId || it.orderId
  );

  // Guard against duplicate orders in the same request payload
  const uniqueOrderIds = new Set(invOrderIds);
  if (uniqueOrderIds.size !== invOrderIds.length) {
    throw ApiError.badRequest('Duplicate investigation orders in invoice items');
  }

  // Retrieve configured GST rate from hospital settings
  const settings = await hospitalSettingsRepository.get();
  const configuredGstRate = Number(settings?.gst_rate ?? 0);

  // Sub-total and total are always derived from line items server-side —
  // never trusted from the client — so a tampered request body can't
  // produce an invoice whose total doesn't match its items.
  const subTotal = items.reduce((sum, item) => sum + item.amount * (item.quantity ?? 1), 0);
  if (discount > subTotal) throw ApiError.badRequest('Discount cannot exceed subtotal');
  const taxableAmount = subTotal - discount;
  const calculatedTax = Math.round(taxableAmount * (configuredGstRate / 100) * 100) / 100;
  const tax = calculatedTax;
  const total = taxableAmount + tax;

  const result = await withTransaction(async (client) => {
    // If invoice includes investigation orders, lock their rows and verify eligibility
    if (invOrderIds.length > 0) {
      const lockedRows = await billsRepository.lockAndVerifyInvestigationOrders(invOrderIds, client);
      const lockedMap = new Map(lockedRows.map((r) => [r.id, r]));

      for (const orderId of invOrderIds) {
        const orderRow = lockedMap.get(orderId);
        if (!orderRow) {
          throw ApiError.notFound(`Investigation order ${orderId} not found`);
        }
        if (orderRow.patient_id !== data.patientId) {
          throw ApiError.badRequest(`Investigation "${orderRow.test_name}" does not belong to the selected patient.`);
        }
        if (orderRow.bill_id || orderRow.billing_status === 'Billed') {
          throw ApiError.conflict(`Investigation "${orderRow.test_name}" has already been billed.`);
        }
        if (orderRow.clinical_status === 'Cancelled' || orderRow.deleted_at) {
          throw ApiError.badRequest(`Investigation "${orderRow.test_name}" is cancelled and cannot be billed.`);
        }
      }
    }

    const header = await billsRepository.createBillHeader(
      { ...data, subTotal, discount, tax, total },
      client
    );

    for (const item of items) {
      const orderId = item.consultationInvestigationId || item.orderId || null;
      await billsRepository.insertItem(
        {
          billId: header.id,
          ...item,
          consultationInvestigationId: orderId
        },
        client
      );
    }

    if (invOrderIds.length > 0) {
      await billsRepository.linkInvestigationOrdersToBill(invOrderIds, header.id, client);
    }

    return billsRepository.findById(header.id, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Generated invoice ${result.invoice_no} for ${result.patient_name}`,
    activityType: 'billing',
    entityType: 'bill',
    entityId: result.id
  });

  const savedItems = await billsRepository.listItems(result.id);
  return serializeBill(result, savedItems);
}

export async function updateBillStatus(id, data, actor) {
  const row = await billsRepository.updateStatus(id, data);
  if (!row) throw ApiError.notFound('Bill not found');

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Invoice ${row.invoice_no} marked as ${data.paymentStatus}`,
    activityType: 'billing',
    entityType: 'bill',
    entityId: row.id
  });

  const items = await billsRepository.listItems(id);
  return serializeBill(row, items);
}
