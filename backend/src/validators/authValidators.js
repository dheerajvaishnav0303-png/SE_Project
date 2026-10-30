import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please provide a valid institutional email address.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password exceeds maximum allowed length.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one numerical digit.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special symbol.'),
  firstName: z
    .string({ required_error: 'First name is required.' })
    .min(2, 'First name must be at least 2 characters.')
    .max(50, 'First name cannot exceed 50 characters.')
    .trim(),
  lastName: z
    .string({ required_error: 'Last name is required.' })
    .min(2, 'Last name must be at least 2 characters.')
    .max(50, 'Last name cannot exceed 50 characters.')
    .trim(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Invalid email address format.')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password cannot be empty.'),
  totpCode: z
    .string()
    .length(6, 'TOTP code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'TOTP code must consist of digits only.')
    .optional(),
});

export const twoFactorVerifySchema = z.object({
  totpCode: z
    .string({ required_error: '6-digit TOTP code is required.' })
    .length(6, 'TOTP code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'TOTP code must consist of digits only.'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required.' })
    .min(1, 'Current password cannot be empty.'),
  newPassword: z
    .string({ required_error: 'New password is required.' })
    .min(8, 'New password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'New password must contain at least one numerical digit.')
    .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special symbol.'),
});

