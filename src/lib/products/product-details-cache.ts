import type { Product } from '@/app/products/[slug]/types';

const PRODUCT_DETAILS_CACHE_PREFIX = 'pdp:details:v1:';
const PRODUCT_DETAILS_TTL_MS = 30 * 60 * 1000;

interface ProductDetailsSnapshot {
  product: Product;
  updatedAt: number;
}

const inMemoryDetailsCache = new Map<string, ProductDetailsSnapshot>();

function getStorageKey(slug: string): string {
  return `${PRODUCT_DETAILS_CACHE_PREFIX}${slug}`;
}

function isExpired(updatedAt: number): boolean {
  return Date.now() - updatedAt > PRODUCT_DETAILS_TTL_MS;
}

function normalizeSlug(slug: string): string {
  return slug.trim();
}

function isValidProduct(candidate: Product | null | undefined): candidate is Product {
  if (!candidate) {
    return false;
  }
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.variants)
  );
}

function readFromSessionStorage(slug: string): Product | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const key = getStorageKey(slug);
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ProductDetailsSnapshot;
    if (
      !parsed ||
      typeof parsed.updatedAt !== 'number' ||
      isExpired(parsed.updatedAt) ||
      !isValidProduct(parsed.product)
    ) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    const normalizedProduct = {
      ...parsed.product,
      slug: normalizeSlug(parsed.product.slug),
    };
    if (!normalizedProduct.slug) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    inMemoryDetailsCache.set(normalizedProduct.slug, {
      product: normalizedProduct,
      updatedAt: parsed.updatedAt,
    });
    return normalizedProduct;
  } catch {
    return null;
  }
}

function writeToSessionStorage(slug: string, snapshot: ProductDetailsSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(getStorageKey(slug), JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export function setProductDetailsSnapshot(product: Product): void {
  if (!isValidProduct(product)) {
    return;
  }
  const normalizedSlug = normalizeSlug(product.slug);
  if (!normalizedSlug) {
    return;
  }
  const normalizedProduct: Product = {
    ...product,
    slug: normalizedSlug,
  };
  const snapshot: ProductDetailsSnapshot = {
    product: normalizedProduct,
    updatedAt: Date.now(),
  };
  inMemoryDetailsCache.set(normalizedSlug, snapshot);
  writeToSessionStorage(normalizedSlug, snapshot);
}

export function getProductDetailsSnapshot(slug: string): Product | null {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  const fromMemory = inMemoryDetailsCache.get(normalizedSlug);
  if (fromMemory) {
    if (isExpired(fromMemory.updatedAt)) {
      inMemoryDetailsCache.delete(normalizedSlug);
    } else {
      return fromMemory.product;
    }
  }

  return readFromSessionStorage(normalizedSlug);
}
