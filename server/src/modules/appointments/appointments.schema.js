import { z } from 'zod';

const APPOINTMENT_TYPE = ['Consultation', 'Therapy', 'Follow Up', 'Surgery', 'Emergency'];
const APPOINTMENT_STATUS = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentDate: z.string().date(),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Expected HH:mm or HH:mm:ss'),
  type: z.enum(APPOINTMENT_TYPE).optional(),
  fee: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(2000).optional()
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS)
});

export const listAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  date: z.string().date().optional(),
  status: z.enum(APPOINTMENT_STATUS).optional()
});
