import type { ProductLabel } from '@/components/ProductLabels';

const PRODUCT_SUMMARY_CACHE_PREFIX = 'pdp:summary:v1:';
const PRODUCT_SUMMARY_TTL_MS = 15 * 60 * 1000;

type ProductSummaryCategory = {
  slug: string;
  title: string;
};

export interface ProductSummarySnapshot {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number;
  oldPrice: number | null;
  discount: number | null;
  category: ProductSummaryCategory | null;
  brand: string | null;
  currency: string;
  labels: ProductLabel[];
  inStock: boolean;
  defaultVariantId: string | null;
  updatedAt: number;
}

const inMemorySummaryCache = new Map<string, ProductSummarySnapshot>();

function getStorageKey(slug: string): string {
  return `${PRODUCT_SUMMARY_CACHE_PREFIX}${slug}`;
}

function isExpired(updatedAt: number): boolean {
  return Date.now() - updatedAt > PRODUCT_SUMMARY_TTL_MS;
}

function normalizeSummary(input: ProductSummarySnapshot): ProductSummarySnapshot {
  return {
    ...input,
    slug: input.slug.trim(),
    title: input.title.trim(),
    currency: input.currency.trim() || 'USD',
    oldPrice: input.oldPrice ?? null,
    discount: input.discount ?? null,
    brand: input.brand?.trim() || null,
    defaultVariantId: input.defaultVariantId ?? null,
    labels: Array.isArray(input.labels) ? input.labels : [],
    category:
      input.category && input.category.slug.trim()
        ? {
            slug: input.category.slug.trim(),
            title: input.category.title.trim(),
          }
        : null,
  };
}

function readFromSessionStorage(slug: string): ProductSummarySnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(slug));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ProductSummarySnapshot;
    if (!parsed?.slug || isExpired(parsed.updatedAt)) {
      window.sessionStorage.removeItem(getStorageKey(slug));
      return null;
    }
    const normalized = normalizeSummary(parsed);
    inMemorySummaryCache.set(slug, normalized);
    return normalized;
  } catch {
    return null;
  }
}

function writeToSessionStorage(summary: ProductSummarySnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(
      getStorageKey(summary.slug),
      JSON.stringify(summary)
    );
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export function setProductSummarySnapshot(
  summary: Omit<ProductSummarySnapshot, 'updatedAt'>
): void {
  const next = normalizeSummary({
    ...summary,
    updatedAt: Date.now(),
  });
  if (!next.slug) {
    return;
  }
  inMemorySummaryCache.set(next.slug, next);
  writeToSessionStorage(next);
}

export function getProductSummarySnapshot(
  slug: string
): ProductSummarySnapshot | null {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const fromMemory = inMemorySummaryCache.get(normalizedSlug);
  if (fromMemory) {
    if (isExpired(fromMemory.updatedAt)) {
      inMemorySummaryCache.delete(normalizedSlug);
    } else {
      return fromMemory;
    }
  }

  return readFromSessionStorage(normalizedSlug);
}
