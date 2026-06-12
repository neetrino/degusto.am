import { r2Asset } from '@/lib/r2-public-url';

/** Food photos for mobile shop category cards (Figma / home parity). */
const MOBILE_SHOP_CATEGORY_PHOTO_POOL = [
  r2Asset('category/20260512-27SeUi_ujs.png'),
  r2Asset('category/20260512-Np6RG2GuNi.png'),
  r2Asset('category/20260512-UOlekxqQyh.png'),
  r2Asset('category/20260512-j5QKmShMEM.png'),
  r2Asset('category/20260512-1bbwOOTncy.png'),
  r2Asset('category/20260517-kebab-NqDwI7.png'),
  r2Asset('category/20260517-pasta-5UoWPF.png'),
  r2Asset('category/20260517-sandwiches-C66rAf.png'),
  r2Asset('category/20260517-wraps-ZpRtZE.png'),
  r2Asset('category/20260517-snacks-kNrFwm.png'),
] as const;

/** Slug → photo map for mobile shop category grid. */
export const MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  all: r2Asset('category/20260512-j5QKmShMEM.png'),
  burger: r2Asset('category/20260512-1bbwOOTncy.png'),
  kebab: r2Asset('category/20260517-kebab-NqDwI7.png'),
  lahmajoun: r2Asset('category/20260517-wraps-ZpRtZE.png'),
  pasta: r2Asset('category/20260517-pasta-5UoWPF.png'),
  pizza: r2Asset('category/20260512-j5QKmShMEM.png'),
  plates: r2Asset('category/20260517-plates-3A6teD.png'),
  salad: r2Asset('assets/20260512-mjMgqeHOCf.png'),
  salads: r2Asset('category/20260512-Np6RG2GuNi.png'),
  sandwiches: r2Asset('category/20260517-sandwiches-C66rAf.png'),
  shawarma: r2Asset('category/20260512-UOlekxqQyh.png'),
  snacks: r2Asset('category/20260517-snacks-kNrFwm.png'),
  soup: r2Asset('assets/20260512-AQ7ex5ejKk.png'),
  soups: r2Asset('assets/20260512-AQ7ex5ejKk.png'),
  'soups-and-hot-dishes': r2Asset('category/20260512-27SeUi_ujs.png'),
  'soups-hot-dishes': r2Asset('category/20260512-27SeUi_ujs.png'),
  wraps: r2Asset('category/20260517-wraps-ZpRtZE.png'),
};

function isSvgCategoryAsset(url: string): boolean {
  return /\.svg($|[?#])/i.test(url);
}

function isRasterCategoryAsset(url: string): boolean {
  return /\.(png|jpe?g|webp|avif)($|[?#])/i.test(url);
}

function hashSlug(slug: string): number {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickPoolPhoto(slug: string): string {
  const index = hashSlug(slug) % MOBILE_SHOP_CATEGORY_PHOTO_POOL.length;
  return MOBILE_SHOP_CATEGORY_PHOTO_POOL[index] ?? MOBILE_SHOP_CATEGORY_PHOTO_POOL[0];
}

/**
 * Mobile shop category card art — prefers food photos over DB SVG icons.
 */
export function resolveMobileShopCategoryImage(slug: string, iconUrl: string | null): string {
  const normalized = slug.trim().toLowerCase();
  const mapped = MOBILE_SHOP_CATEGORY_FALLBACK_IMAGES[normalized];
  if (mapped) {
    return mapped;
  }

  const trimmedIcon = iconUrl?.trim();
  if (trimmedIcon && isRasterCategoryAsset(trimmedIcon) && !isSvgCategoryAsset(trimmedIcon)) {
    return trimmedIcon;
  }

  return pickPoolPhoto(normalized || 'category');
}
