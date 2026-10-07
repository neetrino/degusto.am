import "server-only";

import { and, countDistinct, desc, eq, gte, lte, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  categories,
  orderItems,
  orders,
  productCategories,
  type TranslationsJson,
} from "@/db/schema";
import { resolvePrimaryProductImageUrls } from "@/features/analytics/application/resolve-product-images";
import { revenueEligibleOrderWhere } from "@/features/analytics/application/revenue-where";
import type { AnalyticsPaymentMethodFilter } from "@/features/analytics/domain/payment-method-filter";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";

export type AnalyticsTopProduct = {
  productId: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  quantitySold: number;
  orderCount: number;
  revenueAmount: number;
  unitPriceAmount: number;
};

export type AnalyticsTopCategory = {
  categoryId: string;
  title: string;
  itemCount: number;
  orderCount: number;
  revenueAmount: number;
};

function categoryTitle(translations: TranslationsJson, locale: Locale): string {
  return (
    translations[locale]?.title ??
    translations.hy?.title ??
    translations.en?.title ??
    translations.ru?.title ??
    "Untitled category"
  );
}

/** Stable product key: catalog id, else legacy SKU snapshot. */
function productIdentitySql() {
  return sql<string>`coalesce(${orderItems.productId}::text, 'sku:' || ${orderItems.productSkuSnapshot})`;
}

/** Top products by line revenue in the analytics window. */
export async function queryTopSellingProducts(input: {
  start: Date;
  end: Date;
  paymentMethod?: AnalyticsPaymentMethodFilter;
  limit?: number;
}): Promise<AnalyticsTopProduct[]> {
  const limit = input.limit ?? 5;
  const paymentMethod = input.paymentMethod ?? "all";
  const productKey = productIdentitySql();

  const rows = await getDb()
    .select({
      productId: productKey,
      catalogProductId: sql<string | null>`max(${orderItems.productId}::text)`,
      title: sql<string>`max(${orderItems.productTitleSnapshot})`.mapWith(
        String,
      ),
      sku: sql<string>`max(${orderItems.productSkuSnapshot})`.mapWith(String),
      imageKey: sql<string | null>`max(${orderItems.productImageKeySnapshot})`,
      quantitySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(
        Number,
      ),
      orderCount: countDistinct(orderItems.orderId),
      revenueAmount: sql<number>`coalesce(sum(${orderItems.lineTotalAmount}), 0)`.mapWith(
        Number,
      ),
      unitPriceAmount: sql<number>`coalesce(
        round(
          sum(${orderItems.lineTotalAmount})::numeric
          / nullif(sum(${orderItems.quantity}), 0)
        ),
        0
      )`.mapWith(Number),
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
    .groupBy(productKey)
    .orderBy(desc(sql`sum(${orderItems.lineTotalAmount})`))
    .limit(limit);

  const missingImageProductIds = rows
    .filter((row) => !row.imageKey && row.catalogProductId)
    .map((row) => row.catalogProductId as string);
  const fallbackImages =
    await resolvePrimaryProductImageUrls(missingImageProductIds);

  return rows.map((row) => {
    const snapshotUrl = row.imageKey ? mediaPublicUrl(row.imageKey) : null;
    const fallbackUrl = row.catalogProductId
      ? (fallbackImages.get(row.catalogProductId) ?? null)
      : null;

    return {
      productId: row.productId,
      title: row.title,
      sku: row.sku,
      imageUrl: snapshotUrl ?? fallbackUrl,
      quantitySold: row.quantitySold,
      orderCount: row.orderCount,
      revenueAmount: row.revenueAmount,
      unitPriceAmount: row.unitPriceAmount,
    };
  });
}

/** Top categories by line revenue in the analytics window. */
export async function queryTopCategories(input: {
  start: Date;
  end: Date;
  locale: Locale;
  paymentMethod?: AnalyticsPaymentMethodFilter;
  limit?: number;
}): Promise<AnalyticsTopCategory[]> {
  const limit = input.limit ?? 5;
  const paymentMethod = input.paymentMethod ?? "all";
  const rows = await getDb()
    .select({
      categoryId: categories.id,
      translations: categories.translations,
      itemCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(
        Number,
      ),
      orderCount: countDistinct(orders.id),
      revenueAmount: sql<number>`coalesce(sum(${orderItems.lineTotalAmount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(
      productCategories,
      eq(productCategories.productId, orderItems.productId),
    )
    .innerJoin(categories, eq(categories.id, productCategories.categoryId))
    .where(
      and(
        revenueEligibleOrderWhere(paymentMethod),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    )
    .groupBy(categories.id, categories.translations)
    .orderBy(desc(sql`sum(${orderItems.lineTotalAmount})`))
    .limit(limit);

  return rows.map((row) => ({
    categoryId: row.categoryId,
    title: categoryTitle(row.translations, input.locale),
    itemCount: row.itemCount,
    orderCount: row.orderCount,
    revenueAmount: row.revenueAmount,
  }));
}
