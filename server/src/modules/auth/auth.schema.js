import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    email: z.string().email().optional()
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'At least one of name or email must be provided'
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword']
  });
