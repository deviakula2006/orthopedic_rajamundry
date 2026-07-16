import { z } from 'zod';

export const createReceptionistSchema = z.object({
  name: z.string().min(1).max(150),
  phone: z.string().min(7).max(15),
  email: z.string().email().max(150),
  status: z.enum(['Active', 'Inactive']).optional(),
  shift: z.string().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const updateReceptionistSchema = createReceptionistSchema.omit({ password: true }).partial().extend({
  password: z.string().min(8, 'Password must be at least 8 characters').or(z.literal('')).optional()
});

export const listReceptionistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(150).optional()
});
