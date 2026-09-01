"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db/client";
import {
  categories,
  productCategories,
  products,
  stockMovements,
  type TranslationsJson,
} from "@/db/schema";
import { persistProductMedia } from "@/features/products/application/persist-product-media";
import {
  allocateUniqueProductSlug,
  assertSkuAvailable,
  isProductUniqueViolation,
  uniqueConstraintMessage,
  withSharedProductSlug,
} from "@/features/products/application/product-uniqueness";
import { syncProductModifiers } from "@/features/products/application/sync-product-modifiers";
import { PRODUCT_DEFAULT_STOCK } from "@/features/products/domain/auto-stock";
import { slugifyProductTitle } from "@/features/products/domain/slugify";
import { requireAdmin } from "@/lib/auth/policies";
import { invalidateProductsCache } from "@/lib/cache/invalidate-public";
import { createId } from "@/lib/id";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { err, ok, type Result } from "@/lib/result";
import { isAsciiSlug } from "@/lib/seo/url-slug";

const productModifierSchema = z.object({
  label: z.string().trim().min(1).max(80),
  isEnabled: z.boolean(),
  priceAmount: z.number().int().nonnegative().max(2_147_483_647),
});

const localeTranslationInputSchema = z.object({
  title: z.string().max(200),
  slug: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
});

const productUpsertSchema = z.object({
  sku: z.string().trim().min(1).max(120),
  translations: z.object({
    hy: localeTranslationInputSchema.optional(),
    en: localeTranslationInputSchema.optional(),
    ru: localeTranslationInputSchema.optional(),
  }),
  priceAmount: z.number().int().nonnegative(),
  compareAtAmount: z.number().int().nonnegative().nullable(),
  categoryIds: z.array(z.string().uuid()),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isSpicy: z.boolean(),
  isVegetarian: z.boolean(),
  additions: z.array(productModifierSchema).max(40),
  exclusions: z.array(productModifierSchema).max(40),
  primaryExistingId: z.string().uuid().nullable(),
  primaryNewIndex: z.number().int().nullable(),
  removeImageIds: z.array(z.string().uuid()),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

function primaryTitleFromInput(data: ProductUpsertInput): string {
  for (const loc of locales) {
    const title = data.translations[loc]?.title.trim() ?? "";
    if (title) return title;
  }
  return "";
}

function slugSourceTitle(data: ProductUpsertInput, primaryTitle: string): string {
  const englishTitle = data.translations.en?.title.trim() ?? "";
  return englishTitle || primaryTitle || primaryTitleFromInput(data);
}

/**
 * Builds locale translations with one shared ASCII slug (English title first).
 * Unicode slugs are regenerated; ASCII slugs stay stable on edit.
 */
function buildTranslations(
  data: ProductUpsertInput,
  existingSlug?: string,
): TranslationsJson | null {
  const next: TranslationsJson = {};
  let primaryTitle = "";

  for (const loc of locales) {
    const entry = data.translations[loc];
    if (!entry) continue;
    const title = entry.title.trim();
    if (!title) continue;
    if (!primaryTitle) primaryTitle = title;
    const description = entry.description?.trim();
    next[loc] = {
      title,
      slug: "",
      ...(description ? { description } : {}),
    };
  }

  if (!next.hy && !next.en && !next.ru) {
    return null;
  }

  const preserved = existingSlug?.trim() ?? "";
  const sharedSlug = isAsciiSlug(preserved)
    ? preserved
    : slugifyProductTitle(slugSourceTitle(data, primaryTitle));

  for (const loc of locales) {
    const entry = next[loc];
    if (!entry) continue;
    entry.slug = sharedSlug;
  }

  return next;
}

function primarySlugFromTranslations(translations: TranslationsJson): string {
  return (
    translations.hy?.slug ??
    translations.en?.slug ??
    translations.ru?.slug ??
    ""
  );
}

function revalidateProducts(
  locale: string,
  product: { id: string; slug: string; previousSlug?: string },
): void {
  revalidatePath(`/${locale}/admin/products`);
  revalidatePath(`/${locale}/products`);
  for (const loc of locales) {
    revalidatePath(`/${loc}`);
  }
  invalidateProductsCache({
    productId: product.id,
    slug: product.slug,
  });
  if (product.previousSlug && product.previousSlug !== product.slug) {
    invalidateProductsCache({ slug: product.previousSlug });
  }
}

function parsePayload(formData: FormData): ProductUpsertInput | null {
  const raw = formData.get("data");
  if (typeof raw !== "string") return null;
  try {
    return productUpsertSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function collectImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function syncProductCategories(
  productId: string,
  categoryIds: string[],
): Promise<string | null> {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length > 0) {
    const found = await getDb()
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          inArray(categories.id, uniqueIds),
          isNull(categories.deletedAt),
        ),
      );
    if (found.length !== uniqueIds.length) {
      return "One or more categories were not found.";
    }
  }

  await getDb()
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  if (uniqueIds.length === 0) return null;

  await getDb().insert(productCategories).values(
    uniqueIds.map((categoryId, index) => ({
      id: createId(),
      productId,
      categoryId,
      isPrimary: index === 0,
      sortOrder: index,
    })),
  );

  return null;
}

/** Creates a product from the admin drawer (fields + optional images). */
export async function createProductFromDrawerAction(
  locale: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parsePayload(formData);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid product payload.");
  }

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  const actor = await requireAdmin(locale as Locale);
  const id = createId();
  const files = collectImageFiles(formData);
  const drafted = buildTranslations(data);
  if (!drafted) {
    return err(
      "VALIDATION_ERROR",
      "Fill title for at least one language (HY / EN / RU).",
    );
  }

  const skuTaken = await assertSkuAvailable(data.sku);
  if (skuTaken) return skuTaken;

  const translations = withSharedProductSlug(
    drafted,
    await allocateUniqueProductSlug(primarySlugFromTranslations(drafted)),
  );

  try {
    await getDb().insert(products).values({
      id,
      sku: data.sku,
      priceAmount: data.priceAmount,
      compareAtAmount: data.compareAtAmount,
      stockOnHand: PRODUCT_DEFAULT_STOCK,
      status: data.status,
      isSpicy: data.isSpicy,
      isVegetarian: data.isVegetarian,
      translations,
    });
  } catch (error) {
    if (isProductUniqueViolation(error)) {
      return err("VALIDATION_ERROR", uniqueConstraintMessage(error));
    }
    throw error;
  }

  const categoryError = await syncProductCategories(id, data.categoryIds);
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  const modifiersError = await syncProductModifiers(
    id,
    data.additions,
    data.exclusions,
  );
  if (modifiersError) {
    return err("VALIDATION_ERROR", modifiersError);
  }

  await getDb().insert(stockMovements).values({
    id: createId(),
    productId: id,
    delta: PRODUCT_DEFAULT_STOCK,
    reason: "ADMIN_ADJUSTMENT",
    actorUserId: actor.id,
    resultingBalance: PRODUCT_DEFAULT_STOCK,
  });

  const mediaResult = await persistProductMedia({
    productId: id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? (files.length > 0 ? 0 : null),
    primaryExistingId: null,
    removeImageIds: [],
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  revalidateProducts(locale, {
    id,
    slug: primarySlugFromTranslations(translations),
  });
  return ok({ id });
}

/** Updates a product from the admin drawer (fields + optional images). */
export async function updateProductFromDrawerAction(
  locale: string,
  productId: string,
  formData: FormData,
): Promise<Result<{ id: string }>> {
  if (!isLocale(locale)) {
    return err("INVALID_LOCALE", "Invalid locale.");
  }

  const data = parsePayload(formData);
  if (!data) {
    return err("VALIDATION_ERROR", "Invalid product payload.");
  }

  if (
    data.compareAtAmount != null &&
    data.compareAtAmount < data.priceAmount
  ) {
    return err(
      "VALIDATION_ERROR",
      "Compare-at price must be greater than or equal to price.",
    );
  }

  await requireAdmin(locale as Locale);
  const files = collectImageFiles(formData);

  const [existing] = await getDb()
    .select({
      id: products.id,
      status: products.status,
      translations: products.translations,
    })
    .from(products)
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .limit(1);

  if (!existing) {
    return err("NOT_FOUND", "Product not found.");
  }

  const translations = buildTranslations(
    data,
    primarySlugFromTranslations(existing.translations),
  );
  if (!translations) {
    return err(
      "VALIDATION_ERROR",
      "Fill title for at least one language (HY / EN / RU).",
    );
  }

  const skuTaken = await assertSkuAvailable(data.sku, existing.id);
  if (skuTaken) return skuTaken;

  try {
    await getDb()
      .update(products)
      .set({
        sku: data.sku,
        priceAmount: data.priceAmount,
        compareAtAmount: data.compareAtAmount,
        status: data.status || existing.status,
        isSpicy: data.isSpicy,
        isVegetarian: data.isVegetarian,
        translations,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id));
  } catch (error) {
    if (isProductUniqueViolation(error)) {
      return err("VALIDATION_ERROR", uniqueConstraintMessage(error));
    }
    throw error;
  }

  const categoryError = await syncProductCategories(
    existing.id,
    data.categoryIds,
  );
  if (categoryError) {
    return err("VALIDATION_ERROR", categoryError);
  }

  const modifiersError = await syncProductModifiers(
    existing.id,
    data.additions,
    data.exclusions,
  );
  if (modifiersError) {
    return err("VALIDATION_ERROR", modifiersError);
  }

  const mediaResult = await persistProductMedia({
    productId: existing.id,
    files,
    primaryNewIndex: data.primaryNewIndex ?? null,
    primaryExistingId: data.primaryExistingId ?? null,
    removeImageIds: data.removeImageIds,
  });
  if (mediaResult.error) {
    return err("VALIDATION_ERROR", mediaResult.error);
  }

  const previousSlug = primarySlugFromTranslations(existing.translations);

  revalidateProducts(locale, {
    id: existing.id,
    slug: primarySlugFromTranslations(translations),
    previousSlug,
  });
  return ok({ id: existing.id });
}
