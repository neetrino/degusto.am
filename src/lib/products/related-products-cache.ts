import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import type { StorefrontLocale } from '@/lib/i18n/locale';

type RelatedProductsSnapshot = {
  products: RelatedCardPayload[];
  language: StorefrontLocale;
  cachedAt: number;
};

const RELATED_PRODUCTS_SNAPSHOT_TTL_MS = 3 * 60 * 1000;
const RELATED_PRODUCTS_POOL_TTL_MS = 10 * 60 * 1000;
const RELATED_PRODUCTS_POOL_MAX_ITEMS = 240;
const relatedProductsSnapshotBySlug = new Map<string, RelatedProductsSnapshot>();
const relatedProductsPoolById = new Map<
  string,
  {
    card: RelatedCardPayload;
    cachedAt: number;
  }
>();

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

function trimPoolIfNeeded(): void {
  if (relatedProductsPoolById.size <= RELATED_PRODUCTS_POOL_MAX_ITEMS) {
    return;
  }
  const oldestKey = relatedProductsPoolById.keys().next().value;
  if (typeof oldestKey === 'string') {
    relatedProductsPoolById.delete(oldestKey);
  }
}

function isPoolEntryExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > RELATED_PRODUCTS_POOL_TTL_MS;
}

function isUsableRelatedCard(card: RelatedCardPayload): boolean {
  return card.id.length > 0 && card.slug.length > 0 && card.title.length > 0;
}

function normalizeRelatedCard(card: RelatedCardPayload): RelatedCardPayload {
  return {
    ...card,
    slug: card.slug.trim(),
    title: card.title.trim(),
    image: card.image?.trim() || null,
    categories: Array.isArray(card.categories) ? card.categories : [],
  };
}

/** Adds reusable product cards from Home / Shop / Combo / Related sources. */
export function seedRelatedProductsPool(products: readonly RelatedCardPayload[]): void {
  const now = Date.now();
  for (const card of products) {
    const normalized = normalizeRelatedCard(card);
    if (!isUsableRelatedCard(normalized)) {
      continue;
    }
    relatedProductsPoolById.set(normalized.id, {
      card: normalized,
      cachedAt: now,
    });
    trimPoolIfNeeded();
  }
}

type RelatedProductsPoolOptions = {
  excludeProductId?: string;
  excludeSlug?: string;
  limit: number;
};

/**
 * Reads deduped reusable cards, excluding the current product.
 * Cards stay in memory only and auto-expire quickly.
 */
export function getRelatedProductsPool({
  excludeProductId,
  excludeSlug,
  limit,
}: RelatedProductsPoolOptions): RelatedCardPayload[] {
  const max = Math.max(1, limit);
  const normalizedExcludeSlug = excludeSlug?.trim().toLowerCase() ?? '';
  const cards: RelatedCardPayload[] = [];

  for (const [id, entry] of relatedProductsPoolById) {
    if (isPoolEntryExpired(entry.cachedAt)) {
      relatedProductsPoolById.delete(id);
      continue;
    }
    if (excludeProductId && entry.card.id === excludeProductId) {
      continue;
    }
    if (
      normalizedExcludeSlug.length > 0 &&
      entry.card.slug.trim().toLowerCase() === normalizedExcludeSlug
    ) {
      continue;
    }
    cards.push(entry.card);
    if (cards.length >= max) {
      break;
    }
  }

  return cards;
}
