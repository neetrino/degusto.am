import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password.constants';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').optional(),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export function safeParseForgotPassword(body: unknown) {
  return forgotPasswordSchema.safeParse(body);
}

export function safeParseResetPassword(body: unknown) {
  return resetPasswordSchema.safeParse(body);
}
