import "server-only";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { isR2PublicBaseUrlUsable } from "@/lib/r2/public-base-url";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

/** Seed product placeholders stored in R2 under stable `assets/products/` keys. */
const SEED_PRODUCT_FALLBACKS = [
  "assets/products/burger-1.webp",
  "assets/products/burger-2.webp",
  "assets/products/burger-3.webp",
  "assets/products/burger-4.webp",
  "assets/products/burger-5.webp",
  "assets/products/double-cheeseburger.webp",
] as const;

/** Maps Figma seed category keys to R2 `assets/categories/` object keys. */
const SEED_CATEGORY_FALLBACKS: Readonly<Record<string, string>> = {
  soups: "assets/categories/soup.webp",
  salads: "assets/categories/salad.webp",
  shawarma: "assets/categories/shawarma.webp",
  pizza: "assets/categories/pizza.webp",
  lahmajoun: "assets/categories/lahmajoun.webp",
  khachapuri: "assets/categories/khachapuri.webp",
  khorovats: "assets/categories/khorovats.webp",
  khinkali: "assets/categories/icons/khinkali.webp",
  "stuffed-potato": "assets/categories/icons/stuffed-potato.webp",
  burgers: "assets/categories/icons/burgers-sandwiches.webp",
  "pies-crepes": "assets/categories/icons/cakes-pancakes.webp",
  combo: "assets/categories/combo.webp",
  "lunch-boxes": "assets/categories/icons/lunch-boxes.webp",
  "grill-smoked": "assets/categories/icons/grill-smoked.webp",
  bread: "assets/categories/icons/bread.webp",
  pastry: "assets/categories/icons/pastry.webp",
  omelette: "assets/categories/icons/fried-eggs.webp",
  lenten: "assets/categories/icons/lenten-dishes.webp",
  sushi: "assets/categories/icons/asian-sushi.webp",
  pasta: "assets/categories/icons/pasta.webp",
  sauces: "assets/categories/icons/sauces.webp",
  restaurant: "assets/categories/icons/restaurant.webp",
  bar: "assets/categories/icons/bar-alcohol.webp",
  drinks: "assets/categories/icons/juices-drinks.webp",
  "semi-finished": "assets/categories/icons/semi-finished.webp",
  mexican: "assets/categories/icons/mexican.webp",
};

function hashKey(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function resolveLocalAssetKey(objectKey: string): string {
  const categorySeed = /^assets\/categories\/seed\/([^.]+)\.webp$/.exec(
    objectKey,
  );
  if (categorySeed) {
    return (
      SEED_CATEGORY_FALLBACKS[categorySeed[1] ?? ""] ??
      "assets/categories/pizza.webp"
    );
  }

  if (objectKey.startsWith("assets/products/seed/")) {
    const index = hashKey(objectKey) % SEED_PRODUCT_FALLBACKS.length;
    return SEED_PRODUCT_FALLBACKS[index] ?? SEED_PRODUCT_FALLBACKS[0];
  }

  return objectKey;
}

/**
 * Resolves a stored object key to a public URL.
 * `assets/` keys resolve to the R2 public CDN (same-origin paths no longer
 * exist on disk; Next Image requires absolute remote URLs).
 */
export function mediaPublicUrl(objectKey: string): string {
  const key = resolveLocalAssetKey(objectKey.replace(/^\//, ""));
  if (key.startsWith("assets/")) {
    const envBase = getEnv().R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    if (envBase && isR2PublicBaseUrlUsable(envBase)) {
      return `${envBase}/${key}`;
    }
    return staticAssetUrl(`/${key}`);
  }

  return getProviders().storage.buildPublicUrl(objectKey);
}

/**
 * Browser-readable media URL. Uses signed R2 GETs when the configured
 * public base is the private S3 API host (common misconfig).
 */
export async function resolveMediaPublicUrl(objectKey: string): Promise<string> {
  const key = resolveLocalAssetKey(objectKey.replace(/^\//, ""));
  if (key.startsWith("assets/")) {
    return mediaPublicUrl(key);
  }

  return getProviders().storage.resolveReadableUrl(objectKey);
}
