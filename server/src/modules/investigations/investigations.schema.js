import { z } from 'zod';

export const createInvestigationSchema = z.object({
  testName: z.string().min(1).max(150),
  category: z.string().min(1).max(60),
  price: z.coerce.number().nonnegative(),
  isActive: z.boolean().optional()
});

export const updateInvestigationSchema = createInvestigationSchema.partial();

export const listInvestigationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).max(150).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  includeInactive: z.coerce.boolean().optional()
});
