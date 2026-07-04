import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().min(1).max(150),
  specialization: z.string().min(1).max(100),
  phone: z.string().min(7).max(15),
  email: z.string().email().max(150).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  availabilityNote: z.string().max(100).optional(),
  experienceYears: z.coerce.number().int().min(0).max(70).optional()
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const listDoctorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(150).optional(),
  status: z.enum(['Active', 'Inactive']).optional()
});
