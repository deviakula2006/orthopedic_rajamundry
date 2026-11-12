import { z } from 'zod';

export const updateHospitalSettingsSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().max(1000).optional(),
    contactPhone: z.string().max(30).optional(),
    licenseNumber: z.string().max(100).optional(),
    email: z.string().email('Valid hospital email is required').max(150).optional(),
    gstRate: z.coerce.number().min(0).max(100).optional()
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided'
  });

export const requestRecoveryEmailChangeSchema = z.object({
  email: z.string().trim().email('Valid email address is required').max(150)
});

export const verifyRecoveryEmailChangeSchema = z.object({
  otp: z.string().trim().min(4, 'Verification code must be at least 4 digits').max(10)
});
