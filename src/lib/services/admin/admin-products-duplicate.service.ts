import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";
import { logger } from "@/lib/utils/logger";
import { adminProductsCreateService } from "./admin-products-create.service";
import { getProductById } from "./admin-products-read/product-operations";

const COPY_TITLE_SUFFIX = " (Copy)";

async function ensureUniqueSlugForLocale(slugBase: string, locale: string): Promise<string> {
  const base = slugBase.trim() || "product";
  let candidate = `${base}-copy`;
  let i = 0;
  for (;;) {
    const clash = await db.productTranslation.findFirst({
      where: { slug: candidate, locale },
    });
    if (!clash) {
      return candidate;
    }
    i += 1;
    candidate = `${base}-copy-${i}`;
  }
}

type VariantOptionInput = { attributeKey: string; value: string; valueId?: string };

/**
 * Duplicate a product as an unpublished draft: variants get price 0 and stock 0.
 * Copies media, labels, categories, attribute links, and all translations.
 */
export async function duplicateProductAsDraft(sourceProductId: string): Promise<{ id: string }> {
  const source = await getProductById(sourceProductId);

  const allTranslations = await db.productTranslation.findMany({
    where: { productId: sourceProductId },
    orderBy: { locale: "asc" },
  });

  if (allTranslations.length === 0) {
    throw {
      status: 400,
      type: problemTypes.badRequest,
      title: "Bad Request",
      detail: "Product has no translations to duplicate",
    };
  }

  const primary = allTranslations.find((tr) => tr.locale === "en") ?? allTranslations[0];
  const newSlug = await ensureUniqueSlugForLocale(primary.slug, primary.locale);

  const variantsPayload = source.variants.map((v) => {
    const opts: VariantOptionInput[] = [];
    if (Array.isArray(v.options)) {
      for (const opt of v.options) {
        const o = opt as {
          valueId?: string | null;
          attributeKey?: string | null;
          value?: string | null;
        };
        if (o.attributeKey && o.value) {
          opts.push({
            attributeKey: o.attributeKey,
            value: o.value,
            ...(o.valueId ? { valueId: o.valueId } : {}),
          });
        }
      }
    }
    return {
      price: 0,
      stock: 0,
      imageUrl: v.imageUrl || undefined,
      published: true,
      ...(v.color ? { color: v.color } : {}),
      ...(v.size ? { size: v.size } : {}),
      ...(opts.length > 0 ? { options: opts } : {}),
    };
  });

  if (variantsPayload.length === 0) {
    variantsPayload.push({ price: 0, stock: 0, imageUrl: undefined, published: true });
  }

  const created = await adminProductsCreateService.createProduct({
    title: `${primary.title}${COPY_TITLE_SUFFIX}`,
    slug: newSlug,
    subtitle: primary.subtitle ?? undefined,
    descriptionHtml: primary.descriptionHtml ?? undefined,
    primaryCategoryId: source.primaryCategoryId ?? undefined,
    categoryIds: source.categoryIds ?? [],
    published: false,
    featured: false,
    locale: primary.locale,
    media: source.media as unknown[],
    labels: source.labels.map((l) => ({
      type: l.type,
      value: l.value,
      position: l.position,
      color: l.color ?? undefined,
    })),
    attributeIds: source.attributeIds,
    variants: variantsPayload,
  });

  if (!created?.id) {
    throw {
      status: 500,
      type: problemTypes.internalError,
      title: "Internal Server Error",
      detail: "Duplicate create returned no product id",
    };
  }

  const newProductId = created.id;

  for (const tr of allTranslations) {
    if (tr.locale === primary.locale) {
      continue;
    }
    const slug = await ensureUniqueSlugForLocale(tr.slug, tr.locale);
    await db.productTranslation.create({
      data: {
        productId: newProductId,
        locale: tr.locale,
        title: `${tr.title}${COPY_TITLE_SUFFIX}`,
        slug,
        subtitle: tr.subtitle,
        descriptionHtml: tr.descriptionHtml,
        seoTitle: tr.seoTitle,
        seoDescription: tr.seoDescription,
      },
    });
  }

  logger.debug("[ADMIN PRODUCTS DUPLICATE] Draft duplicate created", {
    sourceId: sourceProductId,
    newId: newProductId,
  });

  return { id: newProductId };
}
