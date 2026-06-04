import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { resolveStorefrontLocale } from "@/lib/i18n/locale";
import { apiRouteCatchErrorResponse } from "@/lib/http/api-route-errors";
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from "@/lib/cart/customizations";
import { sumLineCustomizationPriceAdjustment } from "@/lib/cart/attribute-price-adjustment";
import { computeLineUnitPriceUsd } from "@/lib/cart/line-unit-price";
import { cartVariantDisplayLinesFromPrismaOptions } from "@/lib/cart/cart-variant-display-lines";

interface GuestCartItemInput {
  lineId?: string;
  productId: string;
  productSlug?: string;
  variantId: string;
  quantity: number;
  price?: number;
  customizations?: ProductCustomizations;
}

interface GuestCartRequestBody {
  items?: GuestCartItemInput[];
  lang?: string;
}

interface GuestCartVariant {
  id: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  displayLines: Array<{ attributeKey: string; valueLabel: string }>;
}

interface GuestCartProduct {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  categoryId?: string | null;
  category?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
  };
}

interface GuestCartLine {
  id: string;
  customizations?: ProductCustomizations;
  variant: GuestCartVariant & {
    product: GuestCartProduct;
  };
  quantity: number;
  price: number;
  originalPrice: number | null;
  total: number;
}

interface GuestCartResponse {
  cart: {
    id: string;
    items: GuestCartLine[];
    totals: {
      subtotal: number;
      discount: number;
      shipping: number;
      tax: number;
      total: number;
      currency: string;
    };
    itemsCount: number;
  } | null;
  normalizedItems: GuestCartItemInput[];
}

function pickFirstImage(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const first = media[0];
  if (typeof first === "string") {
    return first.trim() || null;
  }

  if (typeof first === "object" && first !== null) {
    const maybeUrl = "url" in first ? first.url : undefined;
    const maybeSrc = "src" in first ? first.src : undefined;
    const raw = typeof maybeUrl === "string" ? maybeUrl : typeof maybeSrc === "string" ? maybeSrc : "";
    return raw.trim() || null;
  }

  return null;
}

function pickVariantImage(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  const first = imageUrl
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  return first || null;
}

function sanitizeItems(items: GuestCartItemInput[] | undefined): GuestCartItemInput[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => typeof item?.productId === "string" && typeof item?.variantId === "string")
    .map((item) => ({
      lineId: typeof item.lineId === "string" && item.lineId.trim() ? item.lineId : undefined,
      productId: item.productId,
      productSlug: typeof item.productSlug === "string" ? item.productSlug : undefined,
      variantId: item.variantId,
      quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 1,
      price: typeof item.price === "number" ? item.price : undefined,
      customizations: normalizeProductCustomizations(item.customizations),
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GuestCartRequestBody;
    const items = sanitizeItems(body.items);
    const lang = resolveStorefrontLocale(body.lang);

    if (items.length === 0) {
      const empty: GuestCartResponse = {
        cart: null,
        normalizedItems: [],
      };
      return NextResponse.json(empty);
    }

    const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = await db.product.findMany({
      where: {
        id: { in: uniqueProductIds },
        published: true,
        deletedAt: null,
      },
      select: {
        id: true,
        media: true,
        primaryCategoryId: true,
        translations: {
          select: {
            locale: true,
            title: true,
            slug: true,
          },
        },
        categories: {
          select: {
            id: true,
            translations: {
              select: {
                locale: true,
                slug: true,
                title: true,
              },
            },
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            imageUrl: true,
            options: {
              select: {
                attributeKey: true,
                value: true,
                attributeValue: {
                  select: {
                    value: true,
                    translations: { select: { locale: true, label: true } },
                    attribute: { select: { key: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems: GuestCartItemInput[] = [];
    const cartItems: GuestCartLine[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        continue;
      }

      const selectedVariant =
        product.variants.find((variant) => variant.id === item.variantId) ?? product.variants[0];

      if (!selectedVariant) {
        continue;
      }

      const preferredTranslation =
        product.translations.find((translation) => translation.locale === lang) ?? product.translations[0];

      const productSlug =
        (preferredTranslation?.slug && preferredTranslation.slug.trim()) ||
        (item.productSlug && item.productSlug.trim()) ||
        "";
      const primaryCategory =
        product.categories.find((category) => category.id === product.primaryCategoryId) ??
        product.categories[0];
      const categoryTranslation =
        primaryCategory?.translations.find((translation) => translation.locale === lang) ??
        primaryCategory?.translations[0];

      const adj = await sumLineCustomizationPriceAdjustment(
        selectedVariant.id,
        item.customizations
      );
      const unitPrice = computeLineUnitPriceUsd(selectedVariant.price, adj);
      const compareAt =
        selectedVariant.compareAtPrice != null
          ? computeLineUnitPriceUsd(selectedVariant.compareAtPrice, adj)
          : null;

      normalizedItems.push({
        lineId: item.lineId || buildCustomizationLineKey(selectedVariant.id, item.customizations),
        productId: item.productId,
        productSlug: productSlug || undefined,
        variantId: selectedVariant.id,
        quantity: item.quantity,
        price: unitPrice,
        customizations: item.customizations,
      });

      cartItems.push({
        id: `${item.productId}:${item.lineId || buildCustomizationLineKey(selectedVariant.id, item.customizations)}`,
        variant: {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          price: unitPrice,
          compareAtPrice: compareAt,
          stock: selectedVariant.stock,
          imageUrl: selectedVariant.imageUrl,
          displayLines: cartVariantDisplayLinesFromPrismaOptions(selectedVariant.options, lang),
          product: {
            id: product.id,
            title: preferredTranslation?.title || "Product",
            slug: productSlug,
            image: pickVariantImage(selectedVariant.imageUrl) ?? pickFirstImage(product.media),
            categoryId: product.primaryCategoryId,
            category: primaryCategory
              ? {
                  id: primaryCategory.id,
                  slug: categoryTranslation?.slug ?? null,
                  name: categoryTranslation?.title ?? null,
                }
              : undefined,
          },
        },
        quantity: item.quantity,
        customizations: item.customizations,
        price: unitPrice,
        originalPrice: compareAt,
        total: unitPrice * item.quantity,
      });
    }

    if (cartItems.length === 0) {
      const empty: GuestCartResponse = {
        cart: null,
        normalizedItems: [],
      };
      return NextResponse.json(empty);
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const itemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const response: GuestCartResponse = {
      cart: {
        id: "guest-cart",
        items: cartItems,
        totals: {
          subtotal,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: subtotal,
          currency: "AMD",
        },
        itemsCount,
      },
      normalizedItems,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    return apiRouteCatchErrorResponse(req, error, "[CART][GUEST] POST");
  }
}

