import "server-only";

import { and, count, desc, eq, ilike, inArray, notInArray, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders, promotionUsers, users } from "@/db/schema";
import type { DbTransaction } from "@/db/transaction";
import type { CouponUserPickerOption } from "@/features/promotions/domain/coupon-user-picker";
import { MAX_COUPON_ALLOWED_USERS } from "@/features/promotions/domain/coupon-user-picker";
import type { CouponEligibilityContext } from "@/features/promotions/domain/evaluate-coupon";
import { createId } from "@/lib/id";

export { MAX_COUPON_ALLOWED_USERS } from "@/features/promotions/domain/coupon-user-picker";
export type { CouponUserPickerOption } from "@/features/promotions/domain/coupon-user-picker";

type DbClient = Pick<ReturnType<typeof getDb>, "select">;

/** Replaces the promotion allowlist. Empty array means all users. */
export async function syncPromotionAllowedUsers(
  tx: DbTransaction,
  promotionId: string,
  userIds: readonly string[],
): Promise<void> {
  const uniqueIds = [...new Set(userIds)].slice(0, MAX_COUPON_ALLOWED_USERS);

  if (uniqueIds.length > 0) {
    const existing = await tx
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, uniqueIds));

    if (existing.length !== uniqueIds.length) {
      throw new Error("INVALID_USERS");
    }
  }

  await tx
    .delete(promotionUsers)
    .where(eq(promotionUsers.promotionId, promotionId));

  if (uniqueIds.length === 0) {
    return;
  }

  await tx.insert(promotionUsers).values(
    uniqueIds.map((userId) => ({
      id: createId(),
      promotionId,
      userId,
    })),
  );
}

/** Copies allowlist rows from one promotion to another. */
export async function copyPromotionAllowedUsers(
  tx: DbTransaction,
  sourcePromotionId: string,
  targetPromotionId: string,
): Promise<void> {
  const rows = await tx
    .select({ userId: promotionUsers.userId })
    .from(promotionUsers)
    .where(eq(promotionUsers.promotionId, sourcePromotionId));

  await syncPromotionAllowedUsers(
    tx,
    targetPromotionId,
    rows.map((row) => row.userId),
  );
}

/** Returns user ids on the promotion allowlist. */
export async function getPromotionAllowedUserIds(
  promotionId: string,
): Promise<string[]> {
  const rows = await getDb()
    .select({ userId: promotionUsers.userId })
    .from(promotionUsers)
    .where(eq(promotionUsers.promotionId, promotionId));

  return rows.map((row) => row.userId);
}

/** Returns picker rows for currently allowed users. */
export async function getPromotionAllowedUsers(
  promotionId: string,
): Promise<CouponUserPickerOption[]> {
  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
    })
    .from(promotionUsers)
    .innerJoin(users, eq(promotionUsers.userId, users.id))
    .where(eq(promotionUsers.promotionId, promotionId));

  return rows;
}

/** Lightweight user search for the coupon allowlist picker. */
export async function searchAdminUsersForCouponPicker(
  query: string,
  limit = 20,
): Promise<CouponUserPickerOption[]> {
  const trimmed = query.trim();
  const where =
    trimmed.length > 0
      ? and(
          eq(users.status, "ACTIVE"),
          or(
            ilike(users.email, `%${trimmed}%`),
            ilike(users.firstName, `%${trimmed}%`),
            ilike(users.lastName, `%${trimmed}%`),
            ilike(users.phone, `%${trimmed}%`),
          ),
        )
      : eq(users.status, "ACTIVE");

  return getDb()
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(Math.min(limit, MAX_COUPON_ALLOWED_USERS));
}


const NON_COUNTING_ORDER_STATUSES = ["CANCELLED", "REFUNDED"] as const;
export async function loadCouponEligibilityContext(
  promotionId: string,
  userId: string | null,
  client: DbClient = getDb(),
): Promise<CouponEligibilityContext> {
  const [allowlistRow] = await client
    .select({ value: count() })
    .from(promotionUsers)
    .where(eq(promotionUsers.promotionId, promotionId));

  const hasAllowlist = (allowlistRow?.value ?? 0) > 0;
  let isUserAllowed = true;

  if (hasAllowlist) {
    if (!userId) {
      isUserAllowed = false;
    } else {
      const [allowedRow] = await client
        .select({ userId: promotionUsers.userId })
        .from(promotionUsers)
        .where(
          and(
            eq(promotionUsers.promotionId, promotionId),
            eq(promotionUsers.userId, userId),
          ),
        )
        .limit(1);
      isUserAllowed = Boolean(allowedRow);
    }
  }

  let userUsageCount = 0;
  if (userId) {
    const [usageRow] = await client
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          eq(orders.promotionId, promotionId),
          eq(orders.userId, userId),
          notInArray(orders.status, [...NON_COUNTING_ORDER_STATUSES]),
        ),
      );
    userUsageCount = usageRow?.value ?? 0;
  }

  return {
    hasAllowlist,
    isUserAllowed,
    userUsageCount,
    userId,
  };
}
