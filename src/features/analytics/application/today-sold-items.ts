import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orderItems, orders } from "@/db/schema";
import { resolvePrimaryProductImageUrls } from "@/features/analytics/application/resolve-product-images";
import { revenueEligibleOrderWhere } from "@/features/analytics/application/revenue-where";
import type { AnalyticsPaymentMethodFilter } from "@/features/analytics/domain/payment-method-filter";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type AnalyticsTodaySoldItem = {
  orderItemId: string;
  orderNumber: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  lineTotalAmount: number;
  placedAt: string;
};

/** Every revenue-eligible line item placed today (newest first). */
export async function queryTodaySoldItems(input: {
  start: Date;
  end: Date;
  paymentMethod?: AnalyticsPaymentMethodFilter;
}): Promise<AnalyticsTodaySoldItem[]> {
  const paymentMethod = input.paymentMethod ?? "all";

  const rows = await getDb()
    .select({
      orderItemId: orderItems.id,
      orderNumber: orders.orderNumber,
      productId: orderItems.productId,
      title: orderItems.productTitleSnapshot,
      sku: orderItems.productSkuSnapshot,
      imageKey: orderItems.productImageKeySnapshot,
      quantity: orderItems.quantity,
      lineTotalAmount: orderItems.lineTotalAmount,
      placedAt: orders.placedAt,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        revenueEligibleOrderWhere(paymentMethod),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    )
    .orderBy(desc(orders.placedAt), desc(orderItems.id));

  const missingImageProductIds = rows
    .filter((row) => !row.imageKey && row.productId)
    .map((row) => row.productId as string);
  const fallbackImages =
    await resolvePrimaryProductImageUrls(missingImageProductIds);

  return rows.map((row) => {
    const snapshotUrl = row.imageKey ? mediaPublicUrl(row.imageKey) : null;
    const fallbackUrl = row.productId
      ? (fallbackImages.get(row.productId) ?? null)
      : null;

    return {
      orderItemId: row.orderItemId,
      orderNumber: row.orderNumber,
      title: row.title,
      sku: row.sku,
      imageUrl: snapshotUrl ?? fallbackUrl,
      quantity: row.quantity,
      lineTotalAmount: row.lineTotalAmount,
      placedAt: row.placedAt.toISOString(),
    };
  });
}
