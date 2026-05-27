import { unstable_cache } from "next/cache";
import { db } from "@white-shop/db";

/** `revalidateTag` when admin updates global/category/brand discounts. */
export const STOREFRONT_DISCOUNT_SETTINGS_CACHE_TAG = "storefront-discount-settings";

const REVALIDATE_SECONDS = 60;

export interface StorefrontDiscountSettings {
  globalDiscount: number;
  categoryDiscounts: Record<string, number>;
}

async function loadStorefrontDiscountSettings(): Promise<StorefrontDiscountSettings> {
  const discountSettings = await db.settings.findMany({
    where: {
      key: {
        in: ["globalDiscount", "categoryDiscounts"],
      },
    },
  });

  const globalDiscountSetting = discountSettings.find((s) => s.key === "globalDiscount");
  const globalDiscount = Number(globalDiscountSetting?.value) || 0;

  const categoryDiscountsSetting = discountSettings.find((s) => s.key === "categoryDiscounts");
  const categoryDiscounts = categoryDiscountsSetting
    ? ((categoryDiscountsSetting.value as Record<string, number>) || {})
    : {};

  return { globalDiscount, categoryDiscounts };
}

const getStorefrontDiscountSettingsCached = unstable_cache(
  loadStorefrontDiscountSettings,
  ["storefront-discount-settings-v1"],
  {
    revalidate: REVALIDATE_SECONDS,
    tags: [STOREFRONT_DISCOUNT_SETTINGS_CACHE_TAG],
  }
);

/** Cached storefront discount maps (60s TTL, tag-invalidated on admin settings). */
export function getStorefrontDiscountSettings(): Promise<StorefrontDiscountSettings> {
  return getStorefrontDiscountSettingsCached();
}
