import { z } from 'zod';

export const updateHospitalSettingsSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().max(1000).optional(),
    contactPhone: z.string().max(30).optional(),
    licenseNumber: z.string().max(100).optional()
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided'
  });
