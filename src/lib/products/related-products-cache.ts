import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import type { StorefrontLocale } from '@/lib/i18n/locale';

type RelatedProductsSnapshot = {
  products: RelatedCardPayload[];
  language: StorefrontLocale;
  cachedAt: number;
};

const RELATED_PRODUCTS_SNAPSHOT_TTL_MS = 3 * 60 * 1000;
const relatedProductsSnapshotBySlug = new Map<string, RelatedProductsSnapshot>();

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function getRelatedProductsSnapshot(
  slug: string
): RelatedProductsSnapshot | null {
  const key = normalizeSlug(slug);
  const snapshot = relatedProductsSnapshotBySlug.get(key);
  if (!snapshot) {
    return null;
  }
  if (Date.now() - snapshot.cachedAt > RELATED_PRODUCTS_SNAPSHOT_TTL_MS) {
    relatedProductsSnapshotBySlug.delete(key);
    return null;
  }
  return snapshot;
}

export function setRelatedProductsSnapshot(
  slug: string,
  language: StorefrontLocale,
  products: RelatedCardPayload[]
): void {
  const key = normalizeSlug(slug);
  relatedProductsSnapshotBySlug.set(key, {
    products,
    language,
    cachedAt: Date.now(),
  });
}
