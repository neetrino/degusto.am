"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import {
  REGISTER_ERROR_CODES,
  type AuthActionState,
} from "@/features/auth/auth-action-state";
import { registerSchema } from "@/features/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createId } from "@/lib/id";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { logger } from "@/lib/observability/logger";

const TERMS_VERSION = "1.0";

function resolveLocale(localeInput: string, formData: FormData): Locale {
  if (isLocale(localeInput)) {
    return localeInput;
  }

  const fromForm = formData.get("locale");
  if (typeof fromForm === "string" && isLocale(fromForm)) {
    return fromForm;
  }

  return defaultLocale;
}

function isUniqueEmailConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: unknown; message?: unknown };
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return candidate.code === "23505" || message.includes("users_email_uidx");
}

async function insertCustomer(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<string | null> {
  const now = new Date();
  const [user] = await getDb()
    .insert(users)
    .values({
      id: createId(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      passwordUpdatedAt: now,
      // Temporary Phase 3 bypass until the verification provider is connected.
      emailVerifiedAt: now,
      termsAcceptedAt: now,
      termsVersion: TERMS_VERSION,
      role: "CUSTOMER",
      status: "ACTIVE",
    })
    .returning({ id: users.id });

  return user?.id ?? null;
}

export async function registerAction(
  localeInput: string,
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = resolveLocale(localeInput, formData);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const isMismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword",
    );
    return {
      errorCode: isMismatch
        ? REGISTER_ERROR_CODES.PASSWORDS_MISMATCH
        : REGISTER_ERROR_CODES.INVALID,
    };
  }

  const [existingUser] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existingUser) {
    return { errorCode: REGISTER_ERROR_CODES.FAILED };
  }

  let userId: string;
  try {
    const createdId = await insertCustomer(parsed.data);
    if (!createdId) {
      return { errorCode: REGISTER_ERROR_CODES.FAILED };
    }
    userId = createdId;
  } catch (error) {
    if (!isUniqueEmailConflict(error)) {
      logger.error("auth.register_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
    return { errorCode: REGISTER_ERROR_CODES.FAILED };
  }

  await createSession(userId);
  redirect(`/${locale}/profile`);
}
