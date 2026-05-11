import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";
import { computeProductGalleryUrls } from "./product-gallery-urls";
import { getBaseWhere } from "./product-query-builder";

export interface ProductVisualPayload {
  id: string;
  slug: string;
  title: string;
  seo: {
    title: string;
    description: string | null;
  };
  mainImage: string | null;
  galleryImages: string[];
  aspectRatio: string;
  imageWidth: number | null;
  imageHeight: number | null;
}

async function fetchVisualRow(slug: string, lang: string) {
  return db.product.findFirst({
    where: getBaseWhere(slug, lang),
    select: {
      id: true,
      media: true,
      translations: {
        where: { locale: lang },
        select: {
          slug: true,
          title: true,
          seoTitle: true,
          seoDescription: true,
        },
        take: 1,
      },
      variants: {
        where: { published: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          imageUrl: true,
          position: true,
        },
      },
    },
  });
}

function mapRowToPayload(row: NonNullable<Awaited<ReturnType<typeof fetchVisualRow>>>): ProductVisualPayload | null {
  const tr = row.translations[0];
  if (!tr) {
    return null;
  }
  const galleryImages = computeProductGalleryUrls(row.media as unknown[], row.variants);
  const mainImage = galleryImages[0] ?? null;
  return {
    id: row.id,
    slug: tr.slug,
    title: tr.title,
    seo: {
      title: tr.seoTitle ?? tr.title,
      description: tr.seoDescription ?? null,
    },
    mainImage,
    galleryImages,
    aspectRatio: "1 / 1",
    imageWidth: null,
    imageHeight: null,
  };
}

/**
 * Minimal published-product payload for first paint (images + SEO-safe title).
 */
export async function findVisualBySlug(
  slug: string,
  lang: string
): Promise<ProductVisualPayload | null> {
  try {
    let row = await fetchVisualRow(slug, lang);
    if (!row && lang !== "en") {
      row = await fetchVisualRow(slug, "en");
    }
    if (!row) {
      return null;
    }
    const mapped = mapRowToPayload(row);
    return mapped;
  } catch (error: unknown) {
    logger.warn("findVisualBySlug failed", {
      slug,
      lang,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
