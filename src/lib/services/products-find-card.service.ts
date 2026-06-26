import type { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { resolveStorefrontLocale } from "@/lib/i18n/locale";
import {
  transformStorefrontProductCardRows,
} from "./products-slug/product-related-transform";
import {
  getStorefrontProductCardSelect,
  type StorefrontProductCardRow,
} from "./storefront/storefront-product-card-select";
import type { ProductFilters } from "./products-find-query.service";

class ProductsFindCardService {
  /**
   * Lean card read for `GET /api/v1/products?ids=&view=card`.
   */
  async findByIds(filters: ProductFilters) {
    const ids = filters.ids ?? [];
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 12;
    const lang = resolveStorefrontLocale(filters.lang);

    const where: Prisma.ProductWhereInput = {
      published: true,
      deletedAt: null,
      id: { in: ids },
    };

    const [total, rows] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: getStorefrontProductCardSelect(lang),
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<StorefrontProductCardRow[]>,
    ]);

    const data = await transformStorefrontProductCardRows(rows, lang);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const productsFindCardService = new ProductsFindCardService();

export function isProductsCardView(view: string | undefined): boolean {
  return view === "card";
}
