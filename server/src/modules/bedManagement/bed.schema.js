import { z } from 'zod';

// ---------------------------------------------------------------------------
// Ward schemas
// ---------------------------------------------------------------------------

export const createWardSchema = z.object({
  name: z.string().min(1, 'Ward name is required').max(100),
  dailyCharge: z.coerce.number().nonnegative('Daily charge must be >= 0').default(0)
});

// ---------------------------------------------------------------------------
// Bed schemas
// ---------------------------------------------------------------------------

export const createBedSchema = z.object({
  bedNumber: z.string().min(1, 'Bed number is required').max(30)
});

export const assignBedSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID')
});
