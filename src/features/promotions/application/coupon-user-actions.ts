"use server";

import { z } from "zod";

import {
  getPromotionAllowedUsers,
  searchAdminUsersForCouponPicker,
} from "@/features/promotions/application/promotion-user-access";
import { requireAdmin } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

const searchSchema = z.object({
  query: z.string().trim().max(64),
});

const promotionIdSchema = z.object({
  promotionId: z.string().uuid(),
});

/** Searches active users for the coupon allowlist picker. */
export async function searchCouponUsersAction(
  locale: string,
  raw: z.infer<typeof searchSchema>,
): Promise<
  Result<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    }>
  >
> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  await requireAdmin(locale as Locale);

  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid search query.");
  }

  const rows = await searchAdminUsersForCouponPicker(parsed.data.query);
  return ok(rows);
}

/** Loads users currently on a coupon allowlist. */
export async function getCouponAllowedUsersAction(
  locale: string,
  raw: z.infer<typeof promotionIdSchema>,
): Promise<
  Result<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone: string | null;
    }>
  >
> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  await requireAdmin(locale as Locale);

  const parsed = promotionIdSchema.safeParse(raw);
  if (!parsed.success) {
    return err("VALIDATION_ERROR", "Invalid promotion id.");
  }

  const rows = await getPromotionAllowedUsers(parsed.data.promotionId);
  return ok(rows);
}
