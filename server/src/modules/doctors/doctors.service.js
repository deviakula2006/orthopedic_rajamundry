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
  const username = data.username?.trim();
  if (!username) throw ApiError.badRequest('Username is required.');

  // 1. Check username uniqueness (case-insensitive, non-deleted accounts only)
  if (await usersRepository.isUsernameTaken(username)) {
    throw ApiError.badRequest('Username is already taken.');
  }

  // 2. Check email uniqueness (case-insensitive, non-deleted accounts only)
  if (await usersRepository.isEmailTaken(data.email)) {
    throw ApiError.badRequest('Email is already registered');
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  // 4. Run transaction
  const resultDoctor = await withTransaction(async (client) => {
    // 4.1 Find Doctor role ID
    const roleId = await usersRepository.findRoleIdByName('Doctor', client);
    if (!roleId) throw ApiError.internal('Role "Doctor" not found in database');

    // 4.2 Create user account with the explicitly provided username
    const userRow = await usersRepository.create({
      username,
      email: data.email,
      passwordHash,
      fullName: data.name,
      roleId
    }, client);

    if (data.status && data.status !== 'Active') {
      await usersRepository.updateActiveStatus(userRow.id, false, client);
    }

    // 4.3 Create doctor profile
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

  // 5. Log activity
  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Added Dr. ${resultDoctor.name} to panel`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: resultDoctor.id
  });

  return serializeDoctor(resultDoctor);
}

export async function updateDoctor(id, data, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor account could not be found.');

  // Verify or safely heal linked user through doctors.user_id
  let linkedUserId = current.user_id;
  let linkedUser = linkedUserId ? await usersRepository.findById(linkedUserId) : null;

  if (!linkedUser) {
    // Attempt auto-recovery by email
    const emailToSearch = data.email || current.email;
    if (emailToSearch) {
      linkedUser = await usersRepository.findByUsername(emailToSearch);
      if (linkedUser) {
        linkedUserId = linkedUser.id;
        await doctorsRepository.update(id, { userId: linkedUserId });
      }
    }
  }

  // If username is changing, check uniqueness
  if (data.username !== undefined && data.username.trim() !== '') {
    const newUsername = data.username.trim();
    if (await usersRepository.isUsernameTaken(newUsername, linkedUserId)) {
      throw ApiError.badRequest('Username is already taken.');
    }
  }

  // If email is changing, check uniqueness
  if (data.email && data.email.toLowerCase() !== current.email?.toLowerCase()) {
    if (await usersRepository.isEmailTaken(data.email, linkedUserId)) {
      throw ApiError.badRequest('Email is already registered');
    }
  }

  const row = await withTransaction(async (client) => {
    if (!linkedUser) {
      // Create user account if absent
      const username = data.username?.trim();
      if (!username) throw ApiError.badRequest('Username is required to create a login account for this doctor.');

      if (await usersRepository.isUsernameTaken(username, null, client)) {
        throw ApiError.badRequest('Username is already taken.');
      }

      const roleId = await usersRepository.findRoleIdByName('Doctor', client);
      const initialPass = data.password && data.password.trim() !== '' ? data.password : 'Doctor@123';
      const initialHash = await bcrypt.hash(initialPass, env.BCRYPT_SALT_ROUNDS);
      const createdUser = await usersRepository.create(
        {
          username,
          email: data.email || current.email,
          passwordHash: initialHash,
          fullName: data.name || current.name,
          roleId
        },
        client
      );
      linkedUserId = createdUser.id;
      data.userId = linkedUserId;
    } else {
      // Sync user profile: name, email, and optionally username
      await usersRepository.updateProfile(
        linkedUserId,
        {
          fullName: data.name,
          email: data.email,
          username: data.username?.trim() || undefined
        },
        client
      );

      // Sync active status
      if (data.status) {
        await usersRepository.updateActiveStatus(linkedUserId, data.status === 'Active', client);
      }

      // Sync password if provided and not empty
      if (data.password && data.password.trim() !== '') {
        const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);
        await usersRepository.updatePasswordHash(linkedUserId, passwordHash, client);
      }
    }

    return await doctorsRepository.update(id, data, client);
  });

  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Updated credentials of Dr. ${row.name}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });

  return serializeDoctor(row);
}

export async function toggleDoctorStatus(id, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor account could not be found.');

  const nextStatus = current.status === 'Active' ? 'Inactive' : 'Active';

  const row = await withTransaction(async (client) => {
    if (current.user_id) {
      await usersRepository.updateActiveStatus(current.user_id, nextStatus === 'Active', client);
    }
    return await doctorsRepository.setStatus(id, nextStatus, client);
  });

  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
    action: `Toggled status of Dr. ${row.name} to ${nextStatus}`,
    activityType: 'doctor',
    entityType: 'doctor',
    entityId: row.id
  });

  return serializeDoctor(row);
}

export async function deleteDoctor(id, actor) {
  const current = await doctorsRepository.findById(id);
  if (!current) throw ApiError.notFound('Doctor account could not be found.');

  const row = await withTransaction(async (client) => {
    // Soft-delete the linked user account so email/username can be reused
    if (current.user_id) {
      await usersRepository.softDelete(current.user_id, client);
    }
    return await doctorsRepository.softDelete(id, client);
  });

  await logActivity({
    userId: actor?.id ?? null,
    actorName: actor?.name || 'Administrator',
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
