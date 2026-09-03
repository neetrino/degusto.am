"use server";

import { inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { isDemoSeedEntityId } from "@/db/seed/seed-uuid";
import { addToCart } from "@/features/cart/cart";
import { getAdminOrderByNumber } from "@/features/orders/application/queries";
import { requireUser } from "@/lib/auth/policies";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";

export type CustomerReorderResult = {
  addedLines: number;
  unavailableTitles: string[];
};

type CartReorderProduct = {
  id: string;
  sku: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  stockOnHand: number;
};

function toUniqueTitles(titles: string[]): string[] {
  return Array.from(new Set(titles));
}

function isReorderableProduct(product: CartReorderProduct | undefined): boolean {
  if (!product) return false;
  if (product.status !== "ACTIVE") return false;
  if (product.stockOnHand < 1) return false;
  if (isDemoSeedEntityId(product.id)) return false;
  return true;
}

async function loadProductsByIdsAndSkus(
  productIds: string[],
  productSkus: string[],
): Promise<{
  byId: Map<string, CartReorderProduct>;
  bySku: Map<string, CartReorderProduct>;
}> {
  if (productIds.length === 0 && productSkus.length === 0) {
    return { byId: new Map(), bySku: new Map() };
  }

  const rows = await getDb()
    .select({
      id: products.id,
      sku: products.sku,
      status: products.status,
      stockOnHand: products.stockOnHand,
    })
    .from(products)
    .where(
      productIds.length > 0 && productSkus.length > 0
        ? inArray(products.id, productIds)
        : productIds.length > 0
          ? inArray(products.id, productIds)
          : inArray(products.sku, productSkus),
    );

  if (productIds.length > 0 && productSkus.length > 0) {
    const skuRows = await getDb()
      .select({
        id: products.id,
        sku: products.sku,
        status: products.status,
        stockOnHand: products.stockOnHand,
      })
      .from(products)
      .where(inArray(products.sku, productSkus));
    for (const row of skuRows) rows.push(row);
  }

  const uniqueRows = Array.from(new Map(rows.map((row) => [row.id, row])).values());
  return {
    byId: new Map(uniqueRows.map((row) => [row.id, row])),
    bySku: new Map(uniqueRows.map((row) => [row.sku, row])),
  };
}

/** Re-adds customer order lines to cart when products remain available. */
export async function reorderCustomerOrderAction(
  locale: string,
  orderNumber: string,
): Promise<Result<CustomerReorderResult>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const trimmedOrderNumber = orderNumber.trim();
  if (!trimmedOrderNumber || trimmedOrderNumber.length > 64) {
    return err("VALIDATION_ERROR", "Invalid order number.");
  }

  const user = await requireUser(locale as Locale);
  const loaded = await getAdminOrderByNumber(trimmedOrderNumber);

  if (!loaded || loaded.order.userId !== user.id) {
    return err("NOT_FOUND", "Order not found.");
  }

  const productIds = Array.from(
    new Set(
      loaded.items
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const productSkus = Array.from(
    new Set(loaded.items.map((item) => item.productSkuSnapshot)),
  );
  const productsLookup = await loadProductsByIdsAndSkus(productIds, productSkus);

  const unavailableTitles: string[] = [];
  let addedLines = 0;

  for (const item of loaded.items) {
    const product =
      (item.productId ? productsLookup.byId.get(item.productId) : undefined) ??
      productsLookup.bySku.get(item.productSkuSnapshot);

    if (!product) {
      unavailableTitles.push(item.productTitleSnapshot);
      continue;
    }
    if (!isReorderableProduct(product)) {
      unavailableTitles.push(item.productTitleSnapshot);
      continue;
    }

    await addToCart(product.id, item.quantity);
    addedLines += 1;
  }

  return ok({
    addedLines,
    unavailableTitles: toUniqueTitles(unavailableTitles),
  });
}
