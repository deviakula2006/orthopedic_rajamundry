import { z } from 'zod';

export const assignBedSchema = z.object({
  patientId: z.string().uuid('Invalid patientId format')
});

export const listBedsQuerySchema = z.object({
  wardId: z.coerce.number().int().positive().optional(),
  status: z.enum(['Available', 'Occupied', 'Maintenance']).optional()
});
