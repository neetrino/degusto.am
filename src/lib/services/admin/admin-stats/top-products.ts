import { db } from "@white-shop/db";

/**
 * Extract image from product media
 */
function extractImageFromMedia(media: unknown[] | undefined): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const firstMedia = media[0];
  
  if (typeof firstMedia === "string") {
    return firstMedia;
  }
  
  if (firstMedia && typeof firstMedia === "object" && "url" in firstMedia) {
    const mediaObj = firstMedia as { url?: string };
    return mediaObj.url || null;
  }

  return null;
}

/**
 * Get top products for dashboard
 */
export async function getTopProducts(limit: number = 5) {
  const grouped = await db.orderItem.groupBy({
    by: ["variantId"],
    _sum: {
      quantity: true,
      total: true,
    },
    _count: {
      variantId: true,
    },
    orderBy: {
      _sum: {
        total: "desc",
      },
    },
    where: {
      variantId: {
        not: null,
      },
    },
    take: Math.max(limit, 1),
  });

  const variantIds = grouped
    .map((entry) => entry.variantId)
    .filter((variantId): variantId is string => Boolean(variantId));

  if (variantIds.length === 0) {
    return [];
  }

  const variants = await db.productVariant.findMany({
    where: {
      id: { in: variantIds },
    },
    select: {
      id: true,
      productId: true,
      sku: true,
      product: {
        select: {
          media: true,
          translations: {
            where: { locale: "en" },
            take: 1,
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  const variantById = new Map(
    variants.map((variant) => [variant.id, variant] as const)
  );

  return grouped.flatMap((entry) => {
    if (!entry.variantId) {
      return [];
    }
    const variant = variantById.get(entry.variantId);
    if (!variant) {
      return [];
    }
    const translation = variant.product?.translations?.[0];
    const title = translation?.title || "Unknown Product";
    const sku = variant.sku || "N/A";
    const image = extractImageFromMedia(variant.product?.media);

    return [{
      variantId: variant.id,
      productId: variant.productId,
      title,
      sku,
      totalQuantity: entry._sum.quantity ?? 0,
      totalRevenue: entry._sum.total ?? 0,
      orderCount: entry._count.variantId ?? 0,
      image,
    }];
  });
}




