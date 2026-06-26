import { db } from "@white-shop/db";
import { logHotPathSchemaDrift } from "../../utils/db-ensure";
import { logger } from "../../utils/logger";
import type { ProductWithFullRelations } from "./types";

/** PDP + transformer only need requested locale and English fallback. */
function translationLocaleWhere(lang: string) {
  return { locale: { in: [lang, "en"] } };
}

const LOCALE_TRANSLATION_TAKE = 2;

/**
 * Base include configuration for product queries (locale-scoped translations).
 */
function getBaseInclude(lang: string) {
  const localeWhere = translationLocaleWhere(lang);
  return {
    translations: {
      where: localeWhere,
      take: LOCALE_TRANSLATION_TAKE,
    },
    categories: {
      include: {
        translations: {
          where: localeWhere,
          take: LOCALE_TRANSLATION_TAKE,
        },
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        position: "asc" as const,
      },
      include: {
        options: {
          include: {
            attributeValue: {
              include: {
                attribute: {
                  include: {
                    translations: {
                      where: localeWhere,
                      take: LOCALE_TRANSLATION_TAKE,
                    },
                  },
                },
                translations: {
                  where: localeWhere,
                  take: LOCALE_TRANSLATION_TAKE,
                },
              },
            },
          },
        },
      },
    },
    labels: true,
  };
}

/**
 * Base include without attributeValue relation (fallback)
 */
function getBaseIncludeWithoutAttributeValue(lang: string) {
  const localeWhere = translationLocaleWhere(lang);
  return {
    translations: {
      where: localeWhere,
      take: LOCALE_TRANSLATION_TAKE,
    },
    categories: {
      include: {
        translations: {
          where: localeWhere,
          take: LOCALE_TRANSLATION_TAKE,
        },
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        position: "asc" as const,
      },
      include: {
        options: true,
      },
    },
    labels: true,
  };
}

/**
 * ProductAttributes include configuration (locale-scoped labels/names).
 */
function getProductAttributesInclude(lang: string) {
  const localeWhere = translationLocaleWhere(lang);
  return {
    productAttributes: {
      include: {
        attribute: {
          include: {
            translations: {
              where: localeWhere,
              take: LOCALE_TRANSLATION_TAKE,
            },
            values: {
              select: {
                id: true,
                value: true,
                imageUrl: true,
                colors: true,
                priceAdjustment: true,
                translations: {
                  where: localeWhere,
                  take: LOCALE_TRANSLATION_TAKE,
                },
              },
            },
          },
        },
      },
    },
  };
}

/**
 * Base where clause for product queries.
 * Slug lookup is locale-agnostic so links remain valid when a product
 * has translation in one locale only (e.g. freshly seeded data).
 */
export function getBaseWhere(slug: string, lang: string) {
  void lang;
  return {
    translations: {
      some: {
        slug,
      },
    },
    published: true,
    deletedAt: null,
  };
}

function getPublishedProductWhere(productId: string) {
  return {
    id: productId,
    published: true,
    deletedAt: null,
  };
}

/**
 * Lightweight slug → id lookup (indexed translation slug); used before PK-based PDP fetch.
 */
export async function resolveProductIdBySlug(slug: string): Promise<string | null> {
  const row = await db.product.findFirst({
    where: getBaseWhere(slug, "en"),
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Check if error is related to product_attributes table
 */
function isProductAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return errorCode === 'P2021' || errorMessage.includes('product_attributes') || errorMessage.includes('does not exist');
}

/**
 * Check if error is related to product_variants.attributes column
 */
function isVariantAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('product_variants.attributes') || 
         (errorMessage.includes('attributes') && errorMessage.includes('does not exist'));
}

/**
 * Check if error is related to attribute_values.colors column
 */
function isAttributeValuesColorsError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorObj?.code === 'P2022' || 
         errorMessage.includes('attribute_values.colors') || 
         errorMessage.includes('does not exist');
}

/**
 * Fetch product with productAttributes (with fallback handling)
 */
async function fetchWithProductAttributes(
  productId: string,
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseInclude(lang);
  const baseWhere = getPublishedProductWhere(productId);

  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: {
        ...baseInclude,
        ...getProductAttributesInclude(lang),
      },
    });
    const productAttrs = product && 'productAttributes' in product && Array.isArray(product.productAttributes) ? product.productAttributes : [];
    logger.debug('Product attributes count', { count: productAttrs.length });
    return product as unknown as ProductWithFullRelations | null;
  } catch (error: unknown) {
    if (isProductAttributesError(error)) {
      logger.warn('product_attributes table not found, fetching without it', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return fetchWithoutProductAttributes(productId, lang);
    }

    if (isVariantAttributesError(error)) {
      logHotPathSchemaDrift(
        'product_variants."attributes" column',
        error instanceof Error ? error.message : String(error)
      );
      return handleAttributesError(error, productId, lang);
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return fetchWithoutAttributeValue(productId, lang);
    }

    throw error;
  }
}

/**
 * Fetch product without productAttributes (fallback)
 */
async function fetchWithoutProductAttributes(
  productId: string,
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseInclude(lang);
  const baseWhere = getPublishedProductWhere(productId);

  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: baseInclude,
    });
    const productAttrsFallback = product && 'productAttributes' in product && Array.isArray(product.productAttributes) ? product.productAttributes : [];
    logger.debug('Fallback query (without productAttributes)', { count: productAttrsFallback.length });
    return product as unknown as ProductWithFullRelations | null;
  } catch (retryError: unknown) {
    if (isVariantAttributesError(retryError)) {
      logHotPathSchemaDrift(
        'product_variants."attributes" column',
        retryError instanceof Error ? retryError.message : String(retryError)
      );
      return handleAttributesError(retryError, productId, lang);
    }

    if (isAttributeValuesColorsError(retryError)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: retryError instanceof Error ? retryError.message : String(retryError) 
      });
      return fetchWithoutAttributeValue(productId, lang);
    }

    throw retryError;
  }
}

/**
 * Handle attributes-related errors
 */
async function handleAttributesError(
  error: unknown,
  productId: string,
  lang: string
): Promise<ProductWithFullRelations | null> {
  if (isAttributeValuesColorsError(error)) {
    logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return fetchWithoutAttributeValue(productId, lang);
  }
  throw error;
}

/**
 * Fetch product without attributeValue relation (fallback)
 */
async function fetchWithoutAttributeValue(
  productId: string,
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseIncludeWithoutAttributeValue = getBaseIncludeWithoutAttributeValue(lang);
  const baseWhere = getPublishedProductWhere(productId);

  // Try to include productAttributes even in fallback
  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: {
        ...baseIncludeWithoutAttributeValue,
        ...getProductAttributesInclude(lang),
      },
    });
    return product as unknown as ProductWithFullRelations | null;
  } catch (productAttrError: unknown) {
    // If productAttributes also fails, retry without it
    if (isProductAttributesError(productAttrError)) {
      const product = await db.product.findFirst({
        where: baseWhere,
        include: baseIncludeWithoutAttributeValue,
      });
      return product as unknown as ProductWithFullRelations | null;
    }
    throw productAttrError;
  }
}

/**
 * Fetch published product by primary key (faster than slug + deep join filter).
 * Runs core PDP query and productAttributes in parallel (shallower variant includes).
 */
export async function buildProductQueryById(
  productId: string,
  lang: string = "en"
): Promise<ProductWithFullRelations | null> {
  const [coreProduct, productAttributes] = await Promise.all([
    fetchCoreProductById(productId, lang),
    fetchProductAttributesSlice(productId, lang),
  ]);

  if (!coreProduct) {
    return null;
  }

  if (productAttributes !== undefined) {
    return {
      ...coreProduct,
      productAttributes,
    } as unknown as ProductWithFullRelations;
  }

  return coreProduct;
}

async function fetchProductAttributesSlice(
  productId: string,
  lang: string
): Promise<unknown[] | undefined> {
  const baseWhere = getPublishedProductWhere(productId);
  const localeWhere = translationLocaleWhere(lang);

  try {
    const row = await db.product.findFirst({
      where: baseWhere,
      select: {
        productAttributes: {
          include: {
            attribute: {
              include: {
                translations: {
                  where: localeWhere,
                  take: LOCALE_TRANSLATION_TAKE,
                },
                values: {
                  select: {
                    id: true,
                    value: true,
                    imageUrl: true,
                    colors: true,
                    priceAdjustment: true,
                    translations: {
                      where: localeWhere,
                      take: LOCALE_TRANSLATION_TAKE,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return row?.productAttributes;
  } catch (error: unknown) {
    if (isProductAttributesError(error)) {
      return undefined;
    }
    throw error;
  }
}

async function fetchCoreProductById(
  productId: string,
  lang: string
): Promise<ProductWithFullRelations | null> {
  const baseInclude = getBaseIncludeWithoutAttributeValue(lang);
  const baseWhere = getPublishedProductWhere(productId);

  try {
    const product = await db.product.findFirst({
      where: baseWhere,
      include: baseInclude,
    });
    return product as unknown as ProductWithFullRelations | null;
  } catch (error: unknown) {
    if (isVariantAttributesError(error)) {
      logHotPathSchemaDrift(
        'product_variants."attributes" column',
        error instanceof Error ? error.message : String(error)
      );
      return handleAttributesError(error, productId, lang);
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', {
        error: error instanceof Error ? error.message : String(error),
      });
      return fetchWithoutAttributeValue(productId, lang);
    }

    throw error;
  }
}

/**
 * Resolve slug → id, then PK fetch with comprehensive error handling.
 */
export async function buildProductQuery(
  slug: string,
  lang: string = "en"
): Promise<ProductWithFullRelations | null> {
  const productId = await resolveProductIdBySlug(slug);
  if (!productId) {
    await logProductNotFoundDiagnostics(slug, lang);
    return null;
  }

  return buildProductQueryById(productId, lang);
}

/**
 * Log diagnostic information when product is not found
 */
async function logProductNotFoundDiagnostics(slug: string, lang: string): Promise<void> {
  try {
    // Check if product exists with this slug in any language
    const productAnyLang = await db.product.findFirst({
      where: {
        translations: {
          some: {
            slug,
          },
        },
      },
      include: {
        translations: {
          select: {
            locale: true,
            slug: true,
          },
        },
      },
    });

    if (productAnyLang) {
      const availableLangs = productAnyLang.translations.map((t: { locale: string; slug: string }) => t.locale).join(', ');
      logger.warn('Product found with slug but not in requested language', {
        slug,
        requestedLang: lang,
        availableLangs,
        published: productAnyLang.published,
        deletedAt: productAnyLang.deletedAt,
      });
    } else {
      // Check if product exists but is unpublished or deleted
      const productUnpublished = await db.product.findFirst({
        where: {
          translations: {
            some: {
              slug,
              locale: lang,
            },
          },
        },
        select: {
          id: true,
          published: true,
          deletedAt: true,
        },
      });

      if (productUnpublished) {
        logger.warn('Product found but not available', {
          slug,
          lang,
          published: productUnpublished.published,
          deletedAt: productUnpublished.deletedAt,
        });
      } else {
        logger.debug('Product not found in database', { slug, lang });
      }
    }
  } catch (error) {
    logger.error('Error during product diagnostics', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      lang,
    });
  }
}

