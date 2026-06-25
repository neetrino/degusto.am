import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password.constants';

const loginSchema = z
  .object({
    identifier: z.string().min(1, "Email or phone is required").optional(),
    email: z.string().min(1, "Email or phone is required").optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine((data) => Boolean(data.identifier?.trim() || data.email?.trim()), {
    message: "Email or phone is required",
    path: ["identifier"],
  })
  .transform((data) => ({
    identifier: (data.identifier ?? data.email ?? "").trim(),
    password: data.password,
  }));

const registerSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .transform((data) => {
    const emailTrimmed = data.email?.trim().toLowerCase() ?? "";
    const phoneTrimmed = data.phone?.trim() ?? "";
    const firstNameTrimmed = data.firstName?.trim() ?? "";
    const lastNameTrimmed = data.lastName?.trim() ?? "";

    return {
      email: emailTrimmed.length > 0 ? emailTrimmed : undefined,
      phone: phoneTrimmed.length > 0 ? phoneTrimmed : undefined,
      password: data.password,
      firstName: firstNameTrimmed.length > 0 ? firstNameTrimmed : undefined,
      lastName: lastNameTrimmed.length > 0 ? lastNameTrimmed : undefined,
    };
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Either email or phone is required",
    path: ["email"],
  })
  .refine((data) => {
    if (!data.email) {
      return true;
    }
    return z.string().email().safeParse(data.email).success;
  }, {
    message: "Invalid email address",
    path: ["email"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export function parseLoginBody(body: unknown): LoginInput {
  return loginSchema.parse(body);
}

export function parseRegisterBody(body: unknown): RegisterInput {
  return registerSchema.parse(body);
}

export function safeParseLogin(body: unknown): ReturnType<typeof loginSchema.safeParse> {
  return loginSchema.safeParse(body);
}

export function safeParseRegister(body: unknown): ReturnType<typeof registerSchema.safeParse> {
  return registerSchema.safeParse(body);
}
