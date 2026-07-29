import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { productModifiers } from "@/db/schema";
import { createId } from "@/lib/id";

export type ProductModifierInput = {
  label: string;
  isEnabled: boolean;
  /** AMD integer surcharge; additions only (exclusions forced to 0). */
  priceAmount: number;
};

const MAX_MODIFIERS_PER_KIND = 40;
const MAX_MODIFIER_PRICE = 2_147_483_647;

/** Replace all additions/exclusions for a product (admin drawer sync). */
export async function syncProductModifiers(
  productId: string,
  additions: readonly ProductModifierInput[],
  exclusions: readonly ProductModifierInput[],
): Promise<string | null> {
  if (
    additions.length > MAX_MODIFIERS_PER_KIND ||
    exclusions.length > MAX_MODIFIERS_PER_KIND
  ) {
    return `At most ${MAX_MODIFIERS_PER_KIND} modifiers per type are allowed.`;
  }

  const normalizedAdditions = normalizeModifierInputs(additions, true);
  const normalizedExclusions = normalizeModifierInputs(exclusions, false);
  if (normalizedAdditions == null || normalizedExclusions == null) {
    return "Invalid modifier label or price.";
  }

  const db = getDb();
  await db
    .delete(productModifiers)
    .where(eq(productModifiers.productId, productId));

  const rows = [
    ...normalizedAdditions.map((item, index) => ({
      id: createId(),
      productId,
      kind: "ADDITION" as const,
      label: item.label,
      priceAmount: item.priceAmount,
      isEnabled: item.isEnabled,
      sortOrder: index,
    })),
    ...normalizedExclusions.map((item, index) => ({
      id: createId(),
      productId,
      kind: "EXCLUSION" as const,
      label: item.label,
      priceAmount: 0,
      isEnabled: item.isEnabled,
      sortOrder: index,
    })),
  ];

  if (rows.length > 0) {
    await db.insert(productModifiers).values(rows);
  }

  return null;
}

function normalizeModifierInputs(
  items: readonly ProductModifierInput[],
  allowPrice: boolean,
): ProductModifierInput[] | null {
  const next: ProductModifierInput[] = [];
  for (const item of items) {
    const label = item.label.trim().replace(/\s+/g, " ");
    if (label.length < 1 || label.length > 80) {
      return null;
    }
    const rawPrice = allowPrice ? item.priceAmount : 0;
    if (
      !Number.isSafeInteger(rawPrice) ||
      rawPrice < 0 ||
      rawPrice > MAX_MODIFIER_PRICE
    ) {
      return null;
    }
    next.push({
      label,
      isEnabled: item.isEnabled,
      priceAmount: rawPrice,
    });
  }
  return next;
}
