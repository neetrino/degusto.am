import {
  processImageUrl,
  smartSplitUrls,
  cleanImageUrls,
  separateMainAndVariantImages,
} from "../../utils/image-utils";
import { getStorefrontDiscountSettings } from "../storefront/get-storefront-discount-settings";
import { logger } from "../../utils/logger";
import { hasSellableStock } from "../../product-stock";
import { loadProductPdpCustomization } from "@/lib/products/pdp-customization-persistence";
import type { ProductWithFullRelations, ProductVariantWithOptions } from "./types";

/**
 * Calculate actual discount with priority: productDiscount > categoryDiscount > brandDiscount > globalDiscount
 */
function calculateActualDiscount(
  productDiscount: number,
  primaryCategoryId: string | null,
  categoryDiscounts: Record<string, number>,
  globalDiscount: number
): number {
  if (productDiscount > 0) {
    return productDiscount;
  }

  // Check category discounts
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }

  if (globalDiscount > 0) {
    return globalDiscount;
  }

  return 0;
}

/**
 * Transform product media (separate main from variant images)
 */
function transformMedia(
  product: ProductWithFullRelations
): string[] {
  if (!Array.isArray(product.media)) {
    logger.warn('Product media is not an array, returning empty array');
    return [];
  }
  
  // Collect all variant images for separation
  const variantImages: string[] = [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    product.variants.forEach((variant: ProductVariantWithOptions) => {
      if (variant.imageUrl) {
        const urls = smartSplitUrls(variant.imageUrl);
        variantImages.push(...urls);
      }
    });
  }
  
  // Separate main images from variant images
  // Convert JsonValue[] to (string | ImageUrlInput)[] for type compatibility
  const mediaAsStrings = product.media.map((item: unknown) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'url' in item) return item as { url?: string };
    if (item && typeof item === 'object' && 'src' in item) return item as { src?: string };
    if (item && typeof item === 'object' && 'value' in item) return item as { value?: string };
    return String(item);
  });
  const { main } = separateMainAndVariantImages(mediaAsStrings, variantImages);
  
  // Clean and validate final main images
  const cleanedMain = cleanImageUrls(main);
  
  logger.debug('Main media images count (after cleanup)', { count: cleanedMain.length });
  logger.debug('Variant images excluded', { count: variantImages.length });
  if (cleanedMain.length > 0) {
    logger.debug('Main media (first 3)', { images: cleanedMain.slice(0, 3).map((img: string) => img.substring(0, 50)) });
  }
  
  return cleanedMain;
}

/**
 * Transform product labels from DB
 */
function transformLabels(
  product: ProductWithFullRelations,
  _lang: string
): Array<{
  id: string;
  type: string;
  value: string;
  position: string;
  color: string | null;
}> {
  return Array.isArray(product.labels)
    ? product.labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
        id: label.id,
        type: label.type,
        value: label.value,
        position: label.position,
        color: label.color,
      }))
    : [];
}

/**
 * Transform variant image URL
 */
function transformVariantImageUrl(variant: ProductVariantWithOptions): string | null {
  if (!variant.imageUrl) {
    return null;
  }

  // Use smartSplitUrls to handle comma-separated URLs
  const urls = smartSplitUrls(variant.imageUrl);
  // Process and validate each URL
  const processedUrls = urls.map(url => processImageUrl(url)).filter((url): url is string => url !== null);
  // Use first valid URL, or join if multiple (comma-separated)
  return processedUrls.length > 0 ? processedUrls.join(',') : null;
}

/**
 * Transform product variants
 */
function transformVariants(
  variants: ProductVariantWithOptions[],
  actualDiscount: number,
  globalDiscount: number,
  productDiscount: number,
  lang: string
) {
  return variants
    .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
    .map((variant: ProductVariantWithOptions) => {
      const originalPrice = variant.price;
      let finalPrice = originalPrice;
      let discountPrice = null;

      if (actualDiscount > 0 && originalPrice > 0) {
        discountPrice = originalPrice;
        finalPrice = originalPrice * (1 - actualDiscount / 100);
      }

      const variantImageUrl = transformVariantImageUrl(variant);
      
      if (variantImageUrl) {
        logger.debug('Variant has imageUrl', {
          variantId: variant.id,
          sku: variant.sku,
          imageUrl: variantImageUrl.substring(0, 50) + (variantImageUrl.length > 50 ? '...' : ''),
        });
      }

      return {
        id: variant.id,
        sku: variant.sku || "",
        price: finalPrice,
        originalPrice: discountPrice || variant.compareAtPrice || null,
        compareAtPrice: variant.compareAtPrice || null,
        globalDiscount: globalDiscount > 0 ? globalDiscount : null,
        productDiscount: productDiscount > 0 ? productDiscount : null,
        stock: variant.stock,
        imageUrl: variantImageUrl,
        attributes: variant.attributes ?? null,
        options: Array.isArray(variant.options) ? variant.options.map((opt: ProductVariantWithOptions['options'][number]) => {
          // Support both new format (AttributeValue) and old format (attributeKey/value)
          if (opt.attributeValue) {
            // New format: use AttributeValue
            const attrValue = opt.attributeValue;
            const attr = attrValue.attribute;
            const translation = attrValue.translations?.find((t: { locale: string }) => t.locale === lang) || attrValue.translations?.[0];
            // Store canonical slug in `value` so PDP logic and getAttributeLabel() match attributes.json keys.
            const displayLabel = translation?.label || attrValue.value || "";
            return {
              attribute: attr?.key || "",
              key: attr?.key || "",
              value: attrValue.value || "",
              label: displayLabel,
              valueId: attrValue.id,
              attributeId: attr?.id,
            };
          } else {
            // Old format: use attributeKey/value
            return {
              attribute: opt.attributeKey || "",
              value: opt.value || "",
              key: opt.attributeKey || "",
            };
          }
        }) : [],
        available: hasSellableStock(variant.stock),
      };
    });
}

/**
 * Transform productAttributes
 */
function transformProductAttributes(
  product: ProductWithFullRelations,
  lang: string
) {
  const productAttrs = (product as { productAttributes?: unknown[] }).productAttributes;
  logger.debug('Raw productAttributes from DB', {
    isArray: Array.isArray(productAttrs),
    length: productAttrs?.length || 0,
  });
  
  if (Array.isArray(productAttrs) && productAttrs.length > 0) {
    type ProductAttribute = {
      id: string;
      attribute: {
        id: string;
        key: string;
        translations?: Array<{ locale: string; name: string }>;
        values: Array<{
          id: string;
          value: string;
          translations?: Array<{ locale: string; label: string }>;
          imageUrl: string | null;
          colors: string | null;
          priceAdjustment?: number;
        }>;
      };
    };
    
    const mapped = (productAttrs as ProductAttribute[]).map((pa) => {
      const attr = pa.attribute;
      const attrTranslation = attr.translations?.find((t: { locale: string }) => t.locale === lang) || attr.translations?.[0];
      
      return {
        id: pa.id,
        attribute: {
          id: attr.id,
          key: attr.key,
          name: attrTranslation?.name || attr.key,
          values: Array.isArray(attr.values) ? attr.values.map((val: {
            id: string;
            value: string;
            translations?: Array<{ locale: string; label: string }>;
            imageUrl: string | null;
            colors: string | null;
            priceAdjustment?: number | null;
          }) => {
            const valTranslation = val.translations?.find((t: { locale: string }) => t.locale === lang) || val.translations?.[0];
            const adj = val.priceAdjustment;
            return {
              id: val.id,
              value: val.value,
              label: valTranslation?.label || val.value,
              imageUrl: val.imageUrl || null,
              colors: val.colors || null,
              priceAdjustment: typeof adj === "number" && Number.isFinite(adj) ? adj : 0,
            };
          }) : [],
        },
      };
    });
    logger.debug('Mapped productAttributes', { count: mapped.length });
    return mapped;
  }
  logger.debug('No productAttributes, returning empty array');
  return [];
}

/**
 * Transform product data to response format (loads discount settings from DB/cache).
 */
export async function transformProduct(
  product: ProductWithFullRelations,
  lang: string = "en"
) {
  const [{ globalDiscount, categoryDiscounts }, pdpCustomization] = await Promise.all([
    getStorefrontDiscountSettings(),
    loadProductPdpCustomization(product.id),
  ]);
  const transformed = transformProductWithDiscountSettings(product, lang, {
    globalDiscount,
    categoryDiscounts,
  });
  return { ...transformed, pdpCustomization };
}

/**
 * Transform product when discount settings are already loaded (enables parallel fetch).
 */
export function transformProductWithDiscountSettings(
  product: ProductWithFullRelations,
  lang: string = "en",
  discountSettings: { globalDiscount: number; categoryDiscounts: Record<string, number> }
) {
  const { globalDiscount, categoryDiscounts } = discountSettings;

  // Get translations
  const translations = Array.isArray(product.translations) ? product.translations : [];
  const translation = translations.find((t: { locale: string }) => t.locale === lang) || translations[0] || null;
  
  // Get brand translation
  const brandTranslations = product.brand && Array.isArray(product.brand.translations)
    ? product.brand.translations
    : [];
  const brandTranslation = brandTranslations.length > 0
    ? brandTranslations.find((t: { locale: string }) => t.locale === lang) || brandTranslations[0]
    : null;

  const productDiscount = product.discountPercent || 0;
  
  // Calculate actual discount
  const actualDiscount = calculateActualDiscount(
    productDiscount,
    product.primaryCategoryId,
    categoryDiscounts,
    globalDiscount
  );

  // Transform categories
  const categories = Array.isArray(product.categories) ? product.categories.map((cat: { id: string; translations?: Array<{ locale: string; slug: string; title: string }> }) => {
    const catTranslations = Array.isArray(cat.translations) ? cat.translations : [];
    const catTranslation = catTranslations.find((t: { locale: string }) => t.locale === lang) || catTranslations[0] || null;
    return {
      id: cat.id,
      slug: catTranslation?.slug || "",
      title: catTranslation?.title || "",
    };
  }) : [];

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    subtitle: translation?.subtitle || null,
    description: translation?.descriptionHtml || null,
    brand: product.brand
      ? {
          id: product.brand.id,
          slug: product.brand.slug,
          name: brandTranslation?.name || "",
          logo: product.brand.logoUrl,
        }
      : null,
    categories,
    media: transformMedia(product),
    labels: transformLabels(product, lang),
    variants: Array.isArray(product.variants) ? transformVariants(
      product.variants,
      actualDiscount,
      globalDiscount,
      productDiscount,
      lang
    ) : [],
    globalDiscount: globalDiscount > 0 ? globalDiscount : null,
    productDiscount: productDiscount > 0 ? productDiscount : null,
    seo: {
      title: translation?.seoTitle || translation?.title,
      description: translation?.seoDescription || null,
    },
    published: product.published,
    publishedAt: product.publishedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    productAttributes: transformProductAttributes(product, lang),
  };
}

