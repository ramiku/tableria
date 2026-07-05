import { z } from 'zod';

// Misma política que la v1: username alfanumérico simple, contraseña >= 10.
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nick debe tener al menos 3 caracteres')
  .max(20, 'El nick no puede superar 20 caracteres')
  .regex(/^[a-zA-Z0-9_]+$/, 'El nick solo puede tener letras, números y guion bajo');

export const passwordSchema = z.string().min(10, 'La contraseña debe tener al menos 10 caracteres');

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.email('Correo no válido').trim().toLowerCase(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Indica tu nick o correo'),
  password: z.string().min(1, 'Indica tu contraseña'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Correo no válido').trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const twoFactorEnableSchema = z.object({
  code: z.string().trim().min(1),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'Indica tu contraseña'),
});

export const twoFactorVerifySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().trim().min(1),
  trustDevice: z.boolean().default(false),
});

export const magicLinkRequestSchema = z.object({
  identifier: z.string().trim().min(1, 'Indica tu nick o correo'),
});

export const magicLinkConsumeSchema = z.object({
  token: z.string().min(1),
});
