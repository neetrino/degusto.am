/** Fallback card art for mobile shop category grid when DB has no icon. */
export const MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  soup: '/api/r2/assets/20260512-AQ7ex5ejKk.png',
  soups: '/api/r2/assets/20260512-AQ7ex5ejKk.png',
  'soups-and-hot-dishes': '/api/r2/assets/20260512-AQ7ex5ejKk.png',
  salad: '/api/r2/assets/20260512-mjMgqeHOCf.png',
  salads: '/api/r2/assets/20260512-mjMgqeHOCf.png',
  shawarma: '/api/r2/assets/20260512-plUR8fm4WB.png',
};

export function resolveMobileShopCategoryImage(slug: string, iconUrl: string | null): string | null {
  if (iconUrl?.trim()) {
    return iconUrl;
  }
  return MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES[slug.trim().toLowerCase()] ?? null;
}
