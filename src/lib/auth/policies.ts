import "server-only";

import { redirect } from "next/navigation";

import {
  isStaffRole,
  type StaffRole,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";

export type StaffSessionUser = SessionUser & { role: StaffRole };

/** Requires an active authenticated user for a protected server flow. */
export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect(`/${locale}/login`);
  }

  return user;
}

/**
 * Requires an active staff member (admin or dispatcher) for the admin shell.
 */
export async function requireStaff(locale: Locale): Promise<StaffSessionUser> {
  const user = await requireUser(locale);

  if (!isStaffRole(user.role)) {
    redirect(`/${locale}`);
  }

  return user as StaffSessionUser;
}

/** Requires an active administrator for admin-only sections and mutations. */
export async function requireAdmin(locale: Locale): Promise<SessionUser> {
  const user = await requireUser(locale);

  if (user.role === "ADMIN") {
    return user;
  }

  if (user.role === "DISPATCHER") {
    redirect(`/${locale}/admin/orders`);
  }

  redirect(`/${locale}`);
}

/** Staff post-login landing path. */
export function staffHomePath(locale: Locale, role: UserRole): string {
  if (role === "DISPATCHER") {
    return `/${locale}/admin/orders`;
  }
  if (role === "ADMIN") {
    return `/${locale}/admin`;
  }
  return `/${locale}/profile`;
}
