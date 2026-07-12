import { withTransaction } from '../../config/db.js';
import * as billsRepository from './bills.repository.js';
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
  const { items, discount = 0, tax = 0 } = data;

  // Sub-total and total are always derived from line items server-side —
  // never trusted from the client — so a tampered request body can't
  // produce an invoice whose total doesn't match its items.
  const subTotal = items.reduce((sum, item) => sum + item.amount * (item.quantity ?? 1), 0);
  const total = subTotal - discount + tax;
  if (total < 0) throw ApiError.badRequest('Discount cannot exceed subtotal plus tax');

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
