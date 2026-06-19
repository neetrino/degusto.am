import type { MenuCard } from '@/components/home/menu-types';
import { resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { resolveMenuCardCompareAtPrice } from '@/lib/storefront/menu-card-pricing';
import { isPublishedVariantInStock } from '@/lib/storefront/variant-in-stock';
import { resolveStorefrontProductImageFromMedia } from '@/constants/storefront-product-image';
import { resolveShopCategoryTitle } from '@/lib/services/shop-page/shop-page-category-titles';
import type { ShopMenuProductRow } from '@/lib/services/shop-page/shop-page-product-row.types';

/** Lightweight product card payload — shop menu list / soft-nav API. */
export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  category?: {
    name: string;
    slug: string;
  };
  compareAtPrice?: number;
  discountPercent?: number | null;
  inStock: boolean;
  defaultVariantId: string | null;
  supportsSpicy: boolean;
  supportsGreens: boolean;
  /** Omitted on fast list path; defaults to 5 on the client. */
  rating?: number;
};

/** JSON shape for `/api/v1/shop/menu-products` (minimal fields over the wire). */
export type ProductCardApiJson = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice: number;
  image: string | null;
  category?: string;
  categorySlug?: string;
  discountPercent?: number | null;
  inStock?: boolean;
  defaultVariantId?: string | null;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
};

function pickProductTranslation(
  locale: string,
  translations: ShopMenuProductRow['translations']
): ShopMenuProductRow['translations'][number] | undefined {
  return translations.find((item) => item.locale === locale) ?? translations[0];
}

function pickCategoryTranslation(
  locale: string,
  categories: ShopMenuProductRow['categories']
): CategoryTranslationRow | undefined {
  const row = categories[0];
  if (!row) {
    return undefined;
  }
  return row.translations.find((item) => item.locale === locale) ?? row.translations[0];
}

/** Maps a shop menu product row to a card DTO (no reviews, descriptions, or SEO). */
export function mapShopMenuProductRowToProductCardDto(
  locale: string,
  row: ShopMenuProductRow,
  index: number
): ProductCardDTO {
  const translation = pickProductTranslation(locale, row.translations);
  const categoryTranslation = pickCategoryTranslation(locale, row.categories);
  const variant = row.variants[0];
  const price = variant?.price ?? 0;
  const compareAtPrice = resolveMenuCardCompareAtPrice(price, variant?.compareAtPrice);
  const variantCount = row._count?.variants ?? row.variants.length;
  const hasVariantChoice = variantCount > 1;
  const reviewCount = row.ratingSummary?.reviewCount ?? row._count?.reviews ?? 0;
  const rating = reviewCount > 0 ? row.ratingSummary?.avgRating ?? 5 : undefined;
  const foodAttrs = hasVariantChoice
    ? resolveFoodAttributeFlagsFromVariants(row.variants)
    : { supportsSpicy: false, supportsGreens: false };

  return {
    id: row.id,
    slug: translation?.slug ?? 'products',
    name: translation?.title ?? `Product ${index + 1}`,
    price,
    image: resolveStorefrontProductImageFromMedia(row.media),
    category: categoryTranslation
      ? {
          name: resolveShopCategoryTitle(locale, categoryTranslation),
          slug: categoryTranslation.slug,
        }
      : undefined,
    compareAtPrice: compareAtPrice > price ? compareAtPrice : undefined,
    discountPercent: row.discountPercent,
    inStock: isPublishedVariantInStock(variant),
    defaultVariantId: variant?.id ?? null,
    supportsSpicy: foodAttrs.supportsSpicy,
    supportsGreens: foodAttrs.supportsGreens,
    ...(rating !== undefined ? { rating } : {}),
  };
}

export function mapShopMenuProductRowsToProductCardDtos(
  locale: string,
  productRows: ShopMenuProductRow[]
): ProductCardDTO[] {
  return productRows.map((row, index) => mapShopMenuProductRowToProductCardDto(locale, row, index));
}

/** Adapts DTO to existing `MenuCard` consumed by storefront components. */
export function productCardDtoToMenuCard(dto: ProductCardDTO): MenuCard {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.name,
    category: dto.category?.name ?? '',
    categorySlug: dto.category?.slug ?? '',
    image: dto.image,
    price: dto.price,
    oldPrice: dto.compareAtPrice ?? dto.price,
    discount: '',
    discountPercent: dto.discountPercent,
    rating: dto.rating ?? 5,
    inStock: dto.inStock,
    defaultVariantId: dto.defaultVariantId,
    supportsSpicy: dto.supportsSpicy,
    supportsGreens: dto.supportsGreens,
  };
}

export function mapProductCardDtosToMenuCards(dtos: ProductCardDTO[]): MenuCard[] {
  return dtos.map(productCardDtoToMenuCard);
}

/** Serializes card DTOs for shop menu JSON API (drops unused MenuCard legacy fields). */
export function serializeProductCardDtosForApi(dtos: ProductCardDTO[]): ProductCardApiJson[] {
  return dtos.map((dto) => ({
    id: dto.id,
    slug: dto.slug,
    title: dto.name,
    price: dto.price,
    oldPrice: dto.compareAtPrice ?? dto.price,
    image: dto.image,
    ...(dto.category?.name ? { category: dto.category.name } : {}),
    ...(dto.category?.slug ? { categorySlug: dto.category.slug } : {}),
    ...(dto.discountPercent != null ? { discountPercent: dto.discountPercent } : {}),
    inStock: dto.inStock,
    defaultVariantId: dto.defaultVariantId,
    supportsSpicy: dto.supportsSpicy,
    supportsGreens: dto.supportsGreens,
  }));
}

/** Restores full `MenuCard` from lean API JSON. */
export function parseProductCardApiJsonToMenuCard(json: ProductCardApiJson): MenuCard {
  return productCardDtoToMenuCard({
    id: json.id,
    slug: json.slug,
    name: json.title,
    price: json.price,
    compareAtPrice: json.oldPrice > json.price ? json.oldPrice : undefined,
    image: json.image,
    category:
      json.category || json.categorySlug
        ? { name: json.category ?? '', slug: json.categorySlug ?? '' }
        : undefined,
    discountPercent: json.discountPercent,
    inStock: json.inStock ?? true,
    defaultVariantId: json.defaultVariantId ?? null,
    supportsSpicy: json.supportsSpicy ?? false,
    supportsGreens: json.supportsGreens ?? false,
  });
}

/** Strips legacy MenuCard fields before JSON serialization in shop menu API. */
export function menuCardToProductCardApiJson(card: MenuCard): ProductCardApiJson {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title ?? card.slug,
    price: card.price,
    oldPrice: card.oldPrice,
    image: card.image ?? null,
    ...(card.category ? { category: card.category } : {}),
    ...(card.categorySlug ? { categorySlug: card.categorySlug } : {}),
    ...(card.discountPercent != null ? { discountPercent: card.discountPercent } : {}),
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? null,
    supportsSpicy: card.supportsSpicy ?? false,
    supportsGreens: card.supportsGreens ?? false,
  };
}
