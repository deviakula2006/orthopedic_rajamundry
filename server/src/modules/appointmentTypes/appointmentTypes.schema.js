import { z } from 'zod';

export const createAppointmentTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  defaultFee: z.coerce.number().min(0, 'Default fee must be 0 or greater').default(0),
  isActive: z.boolean().optional().default(true)
});

export const updateAppointmentTypeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  defaultFee: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional()
}).refine((data) => Object.values(data).some((v) => v !== undefined), {
  message: 'At least one field must be provided to update'
});

export const listAppointmentTypesQuerySchema = z.object({
  activeOnly: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .optional()
});
