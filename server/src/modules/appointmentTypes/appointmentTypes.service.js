import * as repo from './appointmentTypes.repository.js';
import { serializeAppointmentType } from './appointmentTypes.serializer.js';
import { ApiError } from '../../utils/ApiError.js';
import { logActivity } from '../activities/activities.repository.js';

export async function listAppointmentTypes({ activeOnly = false } = {}) {
  const rows = await repo.list({ activeOnly });
  return rows.map(serializeAppointmentType);
}

export async function getAppointmentType(id) {
  const row = await repo.findById(id);
  if (!row) throw ApiError.notFound('Appointment type not found');
  return serializeAppointmentType(row);
}

export async function createAppointmentType(data, actor) {
  const existing = await repo.findByName(data.name);
  if (existing) {
    throw ApiError.conflict(`An appointment type with the name "${data.name}" already exists`);
  }

  const row = await repo.create(data);

  if (actor) {
    await logActivity({
      userId: actor.id,
      actorName: actor.name,
      action: `Created appointment type "${row.name}" with default fee ₹${row.default_fee}`,
      activityType: 'appointment',
      entityType: 'appointment_type',
      entityId: row.id
    });
  }

  return serializeAppointmentType(row);
}

export async function updateAppointmentType(id, data, actor) {
  const existing = await repo.findById(id);
  if (!existing) {
    throw ApiError.notFound('Appointment type not found');
  }

  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await repo.findByName(data.name);
    if (duplicate && duplicate.id !== id) {
      throw ApiError.conflict(`An appointment type with the name "${data.name}" already exists`);
    }
  }

  const updated = await repo.update(id, data);
  if (!updated) {
    throw ApiError.notFound('Appointment type not found');
  }

  if (actor) {
    await logActivity({
      userId: actor.id,
      actorName: actor.name,
      action: `Updated appointment type "${updated.name}" (fee: ₹${updated.default_fee}, active: ${updated.is_active})`,
      activityType: 'appointment',
      entityType: 'appointment_type',
      entityId: updated.id
    });
  }

  return serializeAppointmentType(updated);
}

export async function toggleAppointmentTypeStatus(id, actor) {
  const existing = await repo.findById(id);
  if (!existing) {
    throw ApiError.notFound('Appointment type not found');
  }

  const newStatus = !existing.is_active;
  const updated = await repo.update(id, { isActive: newStatus });

  if (actor) {
    await logActivity({
      userId: actor.id,
      actorName: actor.name,
      action: `Changed appointment type "${existing.name}" status to ${newStatus ? 'Active' : 'Inactive'}`,
      activityType: 'appointment',
      entityType: 'appointment_type',
      entityId: updated.id
    });
  }

  return serializeAppointmentType(updated);
}
