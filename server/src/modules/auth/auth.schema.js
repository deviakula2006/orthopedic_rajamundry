import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(7).max(15).optional(),
    specialization: z.string().max(100).optional(),
    experienceYears: z.coerce.number().int().min(0).max(70).optional(),
    availabilityNote: z.string().max(100).optional(),
    shift: z.string().max(100).optional()
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one profile field must be provided'
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().optional()
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword']
  })
  .refine(
    (data) => !data.confirmPassword || data.newPassword === data.confirmPassword,
    {
      message: 'New password and confirmation do not match',
      path: ['confirmPassword']
    }
  );

export const forgotPasswordRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username or email identifier is required')
});

export const forgotPasswordVerifySchema = z.object({
  username: z.string().trim().min(1, 'Username or email identifier is required'),
  otp: z.string().trim().min(4, 'Verification code must be at least 4 digits').max(10)
});

export const forgotPasswordResetSchema = z
  .object({
    username: z.string().trim().min(1, 'Username or email identifier is required'),
    resetToken: z.string().trim().min(1, 'Reset session token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
