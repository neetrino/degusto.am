/** Fallback card art for mobile shop category grid when DB has no icon. */
export const MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "burger": "/api/r2/category/20260512-1bbwOOTncy.png",
  "kebab": "/api/r2/category/20260517-kebab-NqDwI7.png",
  "pasta": "/api/r2/category/20260517-pasta-5UoWPF.png",
  "plates": "/api/r2/category/20260517-plates-3A6teD.png",
  "salad": "/api/r2/assets/20260512-mjMgqeHOCf.png",
  "salads": "/api/r2/assets/20260512-mjMgqeHOCf.png",
  "sandwiches": "/api/r2/category/20260517-sandwiches-C66rAf.png",
  "shawarma": "/api/r2/assets/20260512-plUR8fm4WB.png",
  "snacks": "/api/r2/category/20260517-snacks-kNrFwm.png",
  "soup": "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  "soups": "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  "soups-and-hot-dishes": "/api/r2/assets/20260512-AQ7ex5ejKk.png",
  "wraps": "/api/r2/category/20260517-wraps-ZpRtZE.png",
};

export function resolveMobileShopCategoryImage(slug: string, iconUrl: string | null): string | null {
  if (iconUrl?.trim()) {
    return iconUrl;
  }
  return MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES[slug.trim().toLowerCase()] ?? null;
}
