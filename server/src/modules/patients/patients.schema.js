import { z } from 'zod';

const GENDER = ['Male', 'Female', 'Other'];
const BLOOD_GROUP = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const createPatientSchema = z.object({
  name: z.string().min(1).max(150),
  age: z.coerce.number().int().min(0).max(150).optional(),
  dateOfBirth: z.string().date().optional(),
  gender: z.enum(GENDER),
  phone: z.string().min(7).max(15),
  address: z.string().max(500).optional(),
  bloodGroup: z.enum(BLOOD_GROUP).optional(),
  diagnosis: z.string().max(200).optional(),
  lastVisitDate: z.string().date().optional()
});

export const updatePatientSchema = createPatientSchema.partial();

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(150).optional()
});
