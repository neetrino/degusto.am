"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { loginSchema } from "@/features/auth/schemas";
import { createSession } from "@/lib/auth/session";
import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "@/lib/auth/password";
import type { UserRole } from "@/features/users/domain/user-lifecycle";
import { staffHomePath } from "@/lib/auth/policies";
import { type AuthActionState } from "@/features/auth/auth-action-state";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export type { AuthActionState };

function resolveSafeNextPath(
  locale: Locale,
  raw: FormDataEntryValue | null,
  role: UserRole,
): string {
  const fallback = staffHomePath(locale, role);

  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  if (!raw.startsWith(`/${locale}/`)) {
    return fallback;
  }

  // Dispatchers may only land in orders under admin.
  if (
    role === "DISPATCHER" &&
    raw.startsWith(`/${locale}/admin`) &&
    !raw.startsWith(`/${locale}/admin/orders`)
  ) {
    return fallback;
  }

  return raw;
}

export async function loginAction(
  localeInput: string,
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const locale: Locale = isLocale(localeInput) ? localeInput : defaultLocale;
  const invalidCredentials = getDictionary(locale).auth.genericError;

  if (!parsed.success) {
    return { error: invalidCredentials };
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const passwordMatches = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    return { error: invalidCredentials };
  }

  const now = new Date();
  const passwordHash = needsPasswordRehash(user.passwordHash)
    ? await hashPassword(parsed.data.password)
    : undefined;
  await getDb()
    .update(users)
    .set({
      lastLoginAt: now,
      updatedAt: now,
      ...(passwordHash
        ? { passwordHash, passwordUpdatedAt: now }
        : {}),
    })
    .where(eq(users.id, user.id));
  await createSession(user.id);
  redirect(resolveSafeNextPath(locale, formData.get("next"), user.role));
}
