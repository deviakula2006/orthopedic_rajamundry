import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import * as doctorsRepository from './doctors.repository.js';
import { serializeDoctor } from './doctors.serializer.js';
import { logActivity } from '../activities/activities.repository.js';
import { buildMeta } from '../../utils/pagination.js';
import { ApiError } from '../../utils/ApiError.js';
import * as usersRepository from '../users/users.repository.js';
import { withTransaction } from '../../config/db.js';

export async function listDoctors({ page, limit, offset, search, status }) {
  const { rows, total } = await doctorsRepository.list({ limit, offset, search, status });
  return { items: rows.map(serializeDoctor), meta: buildMeta({ page, limit, total }) };
}

export async function getDoctor(id) {
  const row = await doctorsRepository.findById(id);
  if (!row) throw ApiError.notFound('Doctor not found');
  return serializeDoctor(row);
}

export async function createDoctor(data, actor) {
  // 1. Check if email already exists
  const existingUser = await usersRepository.findByUsernameOrEmail(data.email);
  if (existingUser) {
    throw ApiError.badRequest('Email is already registered');
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  // 3. Run transaction
  const resultDoctor = await withTransaction(async (client) => {
    // 3.1 Find Doctor role ID
    const roleId = await usersRepository.findRoleIdByName('Doctor', client);
    if (!roleId) throw ApiError.internal('Role "Doctor" not found in database');

    // 3.2 Generate a unique, stable username
    let baseUsername = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40);
    if (!baseUsername) baseUsername = 'doctor';
    let username = baseUsername;
    let counter = 1;
    while (await usersRepository.findByUsernameOrEmail(username, client)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // 3.3 Create user account
    const userRow = await usersRepository.create({
      username,
      email: data.email,
      passwordHash,
      fullName: data.name,
      roleId
    }, client);

    // 3.4 Create doctor profile
    const doctorRow = await doctorsRepository.create({
      name: data.name,
      specialization: data.specialization,
      phone: data.phone,
      email: data.email,
      status: data.status,
      availabilityNote: data.availabilityNote,
      experienceYears: data.experienceYears,
      userId: userRow.id
    }, client);

    return doctorRow;
  });

  // 4. Log activity
  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Added Dr. ${resultDoctor.name} to panel`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: resultDoctor.id
  });

  return serializeDoctor(resultDoctor);
}

export async function updateDoctor(id, data, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor not found');

  // If email is changing, check duplicate in users table
  if (data.email && data.email !== current.email) {
    const existingUser = await usersRepository.findByUsernameOrEmail(data.email);
    if (existingUser && existingUser.id !== current.user_id) {
      throw ApiError.badRequest('Email is already registered');
    }
  }

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      // Sync user profile
      await usersRepository.updateProfile(current.user_id, {
        fullName: data.name,
        email: data.email
      }, client);

      // Sync active status
      if (data.status) {
        await usersRepository.updateActiveStatus(current.user_id, data.status === 'Active', client);
      }

      // Sync password if provided and not empty
      if (data.password && data.password.trim() !== '') {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);
        await usersRepository.updatePasswordHash(current.user_id, passwordHash, client);
      }
    }

    return await doctorsRepository.update(id, data, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Updated credentials of Dr. ${row.name}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });

  return serializeDoctor(row);
}

export async function toggleDoctorStatus(id, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor not found');

  const nextStatus = current.status === 'Active' ? 'Inactive' : 'Active';

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      await usersRepository.updateActiveStatus(current.user_id, nextStatus === 'Active', client);
    }
    return await doctorsRepository.setStatus(id, nextStatus, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Toggled status of Dr. ${row.name} to ${nextStatus}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });

  return serializeDoctor(row);
}

export async function deleteDoctor(id, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor not found');

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      await usersRepository.updateActiveStatus(current.user_id, false, client);
    }
    return await doctorsRepository.softDelete(id, client);
  });

  await logActivity({
    userId: actor.id,
    actorName: actor.name,
    action: `Removed Dr. ${row.name} from doctors directory`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });
}

export async function getDoctorMe(user) {
  const doctor = await doctorsRepository.findByUserId(user.id);
  if (!doctor) throw ApiError.notFound('Doctor profile not found for logged in user');
  return serializeDoctor(doctor);
}

export async function getDoctorDashboard(user, queryParams = {}) {
  let doctor = await doctorsRepository.findByUserId(user.id);

  if (!doctor && queryParams.doctorId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryParams.doctorId);
    doctor = isUuid ? await doctorsRepository.findById(queryParams.doctorId) : await doctorsRepository.findByCode(queryParams.doctorId);
  }

  if (!doctor) throw ApiError.notFound('Doctor profile not found');

  const summary = await doctorsRepository.getDoctorDashboardSummary({
    doctorId: doctor.id,
    date: queryParams.date
  });

  return {
    doctor: serializeDoctor(doctor),
    metrics: {
      totalAppointments: summary.metrics.total_appointments,
      pendingConsultations: summary.metrics.pending_consultations,
      completedConsultations: summary.metrics.completed_consultations
    },
    queue: summary.queue.map((row) => ({
      appointmentId: row.appointment_id,
      appointmentCode: row.appointment_code,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.type,
      status: row.appointment_status,
      chiefComplaint: row.chief_complaint || 'General Checkup',
      patientId: row.patient_code,
      patientDbId: row.patient_id,
      patientName: row.patient_name,
      patientAge: row.patient_age,
      patientGender: row.patient_gender,
      patientPhone: row.patient_phone,
      consultationId: row.consultation_id,
      consultationStatus: row.consultation_status
    }))
  };
}
