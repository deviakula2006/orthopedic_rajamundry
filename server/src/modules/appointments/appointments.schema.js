import { z } from 'zod';

const APPOINTMENT_STATUS = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
const PATIENT_TYPE = ['Outpatient', 'Inpatient'];

// Accepts 24-hour (HH:mm, HH:mm:ss) or 12-hour (h:mm AM/PM, hh:mm AM/PM)
const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\s*[AaPp][Mm])?$/;

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentDate: z.string().date('Expected date in YYYY-MM-DD format'),
  appointmentTime: z.string().regex(timeRegex, 'Expected valid time format, e.g. 10:00 AM or 14:30'),
  patientType: z.enum(PATIENT_TYPE).optional().default('Outpatient'),
  appointmentTypeId: z.string().uuid('Invalid appointment type ID').optional(),
  type: z.string().max(100).optional(),
  fee: z.coerce.number().nonnegative('Fee must be 0 or greater').optional(),
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
