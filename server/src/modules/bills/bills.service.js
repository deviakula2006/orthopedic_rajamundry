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

export async function createBill(data, actor) {
  const { items, discount = 0 } = data;

  const patient = await patientsRepository.findById(data.patientId);
  if (!patient) throw ApiError.notFound('Patient not found');

  if (data.doctorId) {
    const doctor = await doctorsRepository.findById(data.doctorId);
    if (!doctor) throw ApiError.notFound('Doctor not found');
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
    const header = await billsRepository.createBillHeader(
      { ...data, subTotal, discount, tax, total },
      client
    );
    for (const item of items) {
      await billsRepository.insertItem({ billId: header.id, ...item }, client);
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
