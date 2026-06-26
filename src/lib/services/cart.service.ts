import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { extractMediaUrl } from "../utils/extractMediaUrl";
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from "../cart/customizations";
import {
  sumLineCustomizationPriceAdjustment,
  sumLineCustomizationPriceAdjustmentsForLines,
} from "../cart/attribute-price-adjustment";
import { computeLineUnitPriceUsd } from "../cart/line-unit-price";
import { cartVariantDisplayLinesFromPrismaOptions } from "../cart/cart-variant-display-lines";
import { isStockSufficient, totalVariantQuantityInCart } from "../product-stock";
import { logHotPathSchemaDrift } from "../utils/db-ensure";

class CartService {
  private toCartSummaryPayload(
    cartId: string,
    rows: Array<{ quantity: number; priceSnapshot: Prisma.Decimal | number | null }>
  ) {
    const itemsCount = rows.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = rows.reduce(
      (sum, item) => sum + item.quantity * (Number(item.priceSnapshot) || 0),
      0
    );
    return {
      cart: {
        id: cartId,
        items: [],
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
    };
  }

  private extractVariantImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) {
      return null;
    }

    const first = imageUrl
      .split(",")
      .map((part) => part.trim())
      .find((part) => part.length > 0);

    return first || null;
  }

  private isCartCustomizationsMissingError(error: unknown): boolean {
    const errorObj = error as { code?: string; message?: string };
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      errorObj?.code === "P2022" ||
      errorMessage.includes("cart_items.customizations") ||
      (errorMessage.includes("column") && errorMessage.includes("customizations"))
    );
  }

  private async ensureCartCustomizationsColumnIfMissing(error: unknown): Promise<boolean> {
    if (!this.isCartCustomizationsMissingError(error)) {
      return false;
    }
    logHotPathSchemaDrift(
      'cart_items."customizations" column',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }

  private cartOwnerWhere(userId: string | null, guestToken?: string | null) {
    if (userId) {
      return { userId };
    }
    if (guestToken) {
      return { guestToken };
    }
    throw {
      status: 401,
      type: problemTypes.unauthorized,
      title: "Unauthorized",
      detail: "Cart session required",
    };
  }

  private cartCreateData(
    userId: string | null,
    guestToken: string | null | undefined,
    locale: string
  ) {
    return {
      ...(userId ? { userId } : {}),
      ...(guestToken ? { guestToken } : {}),
      locale,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Get or create cart for authenticated user or guest session.
   */
  async getCart(
    userId: string | null,
    locale: string = "en",
    guestToken?: string | null
  ) {
    if (!userId && !guestToken) {
      return { cart: null };
    }

    const ownerWhere = this.cartOwnerWhere(userId, guestToken);
    const translationLocales = locale === "en" ? ["en"] : [locale, "en"];
    const cartSelect = {
      id: true,
      items: {
        select: {
          id: true,
          variantId: true,
          quantity: true,
          customizations: true,
          priceSnapshot: true,
          variant: {
            select: {
              id: true,
              sku: true,
              stock: true,
              price: true,
              compareAtPrice: true,
              imageUrl: true,
              options: {
                select: {
                  attributeKey: true,
                  value: true,
                  attributeValue: {
                    select: {
                      value: true,
                      attribute: { select: { key: true } },
                      translations: {
                        where: { locale: { in: translationLocales } },
                        select: { locale: true, label: true },
                      },
                    },
                  },
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              media: true,
              primaryCategoryId: true,
              discountPercent: true,
              translations: {
                where: { locale: { in: translationLocales } },
                select: { locale: true, title: true, slug: true },
              },
              categories: {
                select: {
                  id: true,
                  translations: {
                    where: { locale: { in: translationLocales } },
                    select: { locale: true, title: true, slug: true },
                  },
                },
              },
            },
          },
        },
      },
    } as const;

    const loadDiscountSettings = () =>
      db.settings.findMany({
        where: {
          key: {
            in: ["globalDiscount", "categoryDiscounts"],
          },
        },
        select: {
          key: true,
          value: true,
        },
      });

    const findCart = async () =>
      db.cart.findFirst({
        where: ownerWhere,
        select: cartSelect,
      });

    let cart: Awaited<ReturnType<typeof findCart>>;
    let discountSettings: Array<{ key: string; value: Prisma.JsonValue }>;
    try {
      [cart, discountSettings] = await Promise.all([findCart(), loadDiscountSettings()]);
    } catch (error: unknown) {
      const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
      if (!recovered) {
        throw error;
      }
      [cart, discountSettings] = await Promise.all([findCart(), loadDiscountSettings()]);
    }

    const globalDiscount =
      Number(
        discountSettings.find((s: { key: string; value: unknown }) => s.key === "globalDiscount")?.value
      ) || 0;
    const categoryDiscountsSetting = discountSettings.find(
      (s: { key: string; value: unknown }) => s.key === "categoryDiscounts"
    );
    const categoryDiscounts = categoryDiscountsSetting
      ? (categoryDiscountsSetting.value as Record<string, number>) || {}
      : {};

    if (!cart) {
      const createCart = async () =>
        db.cart.create({
          data: {
            ...this.cartCreateData(userId, guestToken, locale),
            items: {
              create: [],
            },
          },
          select: cartSelect,
        });

      try {
        cart = await createCart();
      } catch (error: unknown) {
        const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
        if (!recovered) {
          throw error;
        }
        cart = await createCart();
      }
    }

    const adjustmentByItemId = await sumLineCustomizationPriceAdjustmentsForLines(
      cart.items.map((item) => ({
        lineKey: item.id,
        variantId: item.variantId,
        customizations: normalizeProductCustomizations(item.customizations),
      }))
    );

    // Format items using already-loaded cart data
    const itemsWithDetails = cart.items.map((item) => {
        const product = item.product;
        const variant = item.variant;
        const translation =
          product?.translations?.find((t: { locale: string }) => t.locale === locale) ||
          product?.translations?.[0];

        const imageUrl = this.extractVariantImageUrl(variant?.imageUrl) ?? extractMediaUrl(product?.media);
        const primaryCategory =
          product?.categories?.find((category) => category.id === product?.primaryCategoryId) ??
          product?.categories?.[0];
        const categoryTranslation =
          primaryCategory?.translations?.find((translation) => translation.locale === locale) ??
          primaryCategory?.translations?.[0];

        const productDiscount = product?.discountPercent ?? 0;
        let appliedDiscount = 0;
        if (productDiscount > 0) {
          appliedDiscount = productDiscount;
        } else {
          const primaryCategoryId = product?.primaryCategoryId;
          if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
            appliedDiscount = categoryDiscounts[primaryCategoryId];
          } else if (globalDiscount > 0) {
            appliedDiscount = globalDiscount;
          }
        }

        const custom = normalizeProductCustomizations(item.customizations);
        const snapshotRaw = item.priceSnapshot != null ? Number(item.priceSnapshot) : NaN;
        const recomputedAdj = adjustmentByItemId.get(item.id) ?? 0;
        const variantBaseUsd = variant?.price ?? 0;
        const hasCustomizations = Boolean(
          custom?.additions ||
            custom?.exclusions ||
            (custom?.selectedAttributeValueIds?.length ?? 0) > 0
        );
        const listPriceBase =
          hasCustomizations || recomputedAdj > 0
            ? computeLineUnitPriceUsd(variantBaseUsd, recomputedAdj)
            : Number.isFinite(snapshotRaw) && snapshotRaw >= 0
              ? snapshotRaw
              : variantBaseUsd;

        const variantOriginalPrice = listPriceBase;
        let finalPrice = variantOriginalPrice;
        let originalPrice: number | null = null;
        if (appliedDiscount > 0 && variantOriginalPrice > 0) {
          finalPrice = variantOriginalPrice * (1 - appliedDiscount / 100);
          originalPrice = variantOriginalPrice;
        } else if (variant?.compareAtPrice != null) {
          const compareAtAdjusted = computeLineUnitPriceUsd(
            Number(variant.compareAtPrice),
            recomputedAdj
          );
          if (compareAtAdjusted > listPriceBase) {
            originalPrice = compareAtAdjusted;
          }
        }

        return {
          id: item.id,
          variant: {
            id: variant?.id ?? item.variantId,
            sku: variant?.sku ?? "",
            stock: variant?.stock ?? 0,
            displayLines: cartVariantDisplayLinesFromPrismaOptions(variant?.options, locale),
            product: {
              id: product?.id ?? "",
              title: translation?.title ?? "",
              slug: translation?.slug ?? "",
              image: imageUrl,
              categoryId: product?.primaryCategoryId ?? null,
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
          customizations: custom,
          price: finalPrice,
          originalPrice,
          total: finalPrice * item.quantity,
        };
      });

    const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.total, 0);

    return {
      cart: {
        id: cart.id,
        items: itemsWithDetails,
        totals: {
          subtotal,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: subtotal,
          currency: "AMD",
        },
        itemsCount: itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  }

  /**
   * Lightweight badge/cart-summary read path (no heavy product/variant joins).
   */
  async getCartSummary(
    userId: string | null,
    locale: string = "en",
    guestToken?: string | null
  ) {
    void locale;
    if (!userId && !guestToken) {
      return { cart: null };
    }

    const ownerWhere = this.cartOwnerWhere(userId, guestToken);
    const cart = await db.cart.findFirst({
      where: ownerWhere,
      select: {
        id: true,
        items: {
          select: {
            quantity: true,
            priceSnapshot: true,
          },
        },
      },
    });

    if (!cart) {
      return { cart: null };
    }

    return this.toCartSummaryPayload(cart.id, cart.items);
  }

  /**
   * Add item to cart
   */
  async addItem(
    userId: string | null,
    data: {
      variantId: string;
      productId: string;
      quantity?: number;
      customizations?: ProductCustomizations;
    },
    locale: string = "en",
    guestToken?: string | null
  ) {
    const { variantId, productId, quantity = 1 } = data;
    const normalizedCustomizations = normalizeProductCustomizations(data.customizations);
    const ownerWhere = this.cartOwnerWhere(userId, guestToken);

    if (!variantId || !productId) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation failed",
        detail: "variantId and productId are required",
      };
    }

    const findCartAndVariant = async () =>
      Promise.all([
        db.cart.findFirst({
          where: ownerWhere,
          include: { items: true },
        }),
        db.productVariant.findUnique({
          where: { id: variantId },
          select: { id: true, published: true, productId: true, stock: true, price: true },
        }),
      ]);

    type CartAndVariantTuple = Awaited<ReturnType<typeof findCartAndVariant>>;
    let cart: CartAndVariantTuple[0];
    let variant: CartAndVariantTuple[1];
    try {
      [cart, variant] = await findCartAndVariant();
    } catch (error: unknown) {
      const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
      if (!recovered) {
        throw error;
      }
      [cart, variant] = await findCartAndVariant();
    }

    let resolvedCart = cart;
    if (!resolvedCart) {
      const createCart = async () =>
        db.cart.create({
          data: {
            ...this.cartCreateData(userId, guestToken, locale),
            items: { create: [] },
          },
          include: { items: true },
        });
      try {
        resolvedCart = await createCart();
      } catch (error: unknown) {
        const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
        if (!recovered) {
          throw error;
        }
        resolvedCart = await createCart();
      }
    }

    if (!variant || !variant.published || variant.productId !== productId) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Variant not found",
      };
    }

    const requestedLineKey = buildCustomizationLineKey(variantId, normalizedCustomizations);
    const existingItem = resolvedCart.items.find(
      (item) =>
        buildCustomizationLineKey(
          item.variantId,
          normalizeProductCustomizations(item.customizations)
        ) === requestedLineKey
    );

    // Calculate total quantity for this variant across all cart lines after adding
    const totalQuantity = existingItem
      ? totalVariantQuantityInCart(resolvedCart.items, variantId, {
          lineId: existingItem.id,
          quantity: existingItem.quantity + quantity,
        })
      : totalVariantQuantityInCart(resolvedCart.items, variantId, { addQuantity: quantity });

    // Check if total quantity exceeds available stock
    if (!isStockSufficient(variant.stock, totalQuantity)) {
      const alreadyInCart = totalQuantity - quantity;
      logger.warn("Cart: stock limit exceeded", {
        variantId,
        currentInCart: alreadyInCart,
        requestedQuantity: quantity,
        totalQuantity,
        availableStock: variant.stock,
      });
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Insufficient stock",
        detail: `No more stock available. Maximum available: ${variant.stock}, already in cart: ${alreadyInCart}, requested: ${quantity}`,
      };
    }

    const attrAdj = await sumLineCustomizationPriceAdjustment(
      variantId,
      normalizedCustomizations
    );
    const unitPriceWithAdjustments = computeLineUnitPriceUsd(Number(variant.price), attrAdj);

    let item;
    if (existingItem) {
      logger.debug("Cart: updating existing item", {
        itemId: existingItem.id,
        oldQuantity: existingItem.quantity,
        newQuantity: totalQuantity,
        customizations: normalizedCustomizations,
      });
      const updateItem = async () =>
        db.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: totalQuantity,
          },
        });
      try {
        item = await updateItem();
      } catch (error: unknown) {
        const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
        if (!recovered) {
          throw error;
        }
        item = await updateItem();
      }
      // Summary from current state: other items + this updated item (no extra DB query)
      const otherItems = resolvedCart.items.filter((i: { id: string }) => i.id !== existingItem.id);
      const itemsForSum = [
        ...otherItems.map((i: { quantity: number; priceSnapshot: unknown }) => ({ q: i.quantity, p: Number(i.priceSnapshot) })),
        { q: totalQuantity, p: Number(item.priceSnapshot) },
      ];
      const itemsCount = itemsForSum.reduce((sum, i) => sum + i.q, 0);
      const total = itemsForSum.reduce((sum, i) => sum + i.q * i.p, 0);
      return {
        item: {
          id: item.id,
          variantId,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
          customizations: normalizeProductCustomizations(item.customizations),
        },
        cartSummary: { itemsCount, total },
      };
    } else {
      logger.debug("Cart: creating new item", {
        variantId,
        quantity,
        customizations: normalizedCustomizations,
      });
      const createItem = async () =>
        db.cartItem.create({
          data: {
            cartId: resolvedCart.id,
            variantId,
            productId,
            quantity,
            customizations: normalizedCustomizations as Prisma.InputJsonValue | undefined,
            priceSnapshot: unitPriceWithAdjustments,
          },
        });
      try {
        item = await createItem();
      } catch (error: unknown) {
        const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
        if (!recovered) {
          throw error;
        }
        item = await createItem();
      }
      const itemsForSum = [
        ...resolvedCart.items.map((i: { quantity: number; priceSnapshot: unknown }) => ({ q: i.quantity, p: Number(i.priceSnapshot) })),
        { q: quantity, p: unitPriceWithAdjustments },
      ];
      const itemsCount = itemsForSum.reduce((sum, i) => sum + i.q, 0);
      const total = itemsForSum.reduce((sum, i) => sum + i.q * i.p, 0);
      return {
        item: {
          id: item.id,
          variantId,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
          customizations: normalizeProductCustomizations(item.customizations),
        },
        cartSummary: { itemsCount, total },
      };
    }
  }

  /**
   * Update cart item
   */
  async updateItem(
    userId: string | null,
    itemId: string,
    quantity: number,
    guestToken?: string | null
  ) {
    if (!quantity || quantity < 1) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation failed",
        detail: "quantity must be at least 1",
      };
    }

    const ownerWhere = this.cartOwnerWhere(userId, guestToken);

    const cart = await db.cart.findFirst({
      where: {
        ...ownerWhere,
        items: {
          some: {
            id: itemId,
          },
        },
      },
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    const item = cart.items.find((row) => row.id === itemId);
    if (!item) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
    });

    const totalVariantQty = totalVariantQuantityInCart(cart.items, item.variantId, {
      lineId: itemId,
      quantity,
    });

    if (!variant || !isStockSufficient(variant.stock, totalVariantQty)) {
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Insufficient stock",
        detail: `Requested quantity (${quantity}) exceeds available stock (${variant?.stock || 0})`,
      };
    }

    const { count } = await db.cartItem.updateMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      data: { quantity },
    });

    if (count === 0) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    const updatedItem = await db.cartItem.findUnique({
      where: { id: itemId },
      select: { id: true, quantity: true },
    });

    if (!updatedItem) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    return {
      item: {
        id: updatedItem.id,
        quantity: updatedItem.quantity,
      },
    };
  }

  /**
   * Remove item from cart
   */
  async removeItem(
    userId: string | null,
    itemId: string,
    guestToken?: string | null
  ) {
    const ownerWhere = this.cartOwnerWhere(userId, guestToken);

    const cart = await db.cart.findFirst({
      where: {
        ...ownerWhere,
        items: {
          some: {
            id: itemId,
          },
        },
      },
    });

    if (!cart) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    const { count } = await db.cartItem.deleteMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (count === 0) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    return null;
  }

  /** Move guest DB cart lines into the authenticated user's cart after login. */
  async mergeGuestCartIntoUser(
    guestToken: string,
    userId: string,
    locale: string = "en"
  ): Promise<void> {
    const guestCart = await db.cart.findFirst({
      where: { guestToken },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return;
    }

    for (const item of guestCart.items) {
      await this.addItem(
        userId,
        {
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          customizations: normalizeProductCustomizations(item.customizations),
        },
        locale
      );
    }

    await db.cart.delete({ where: { id: guestCart.id } });
  }
}

export const cartService = new CartService();

