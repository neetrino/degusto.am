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
import { sumVerifiedAttributePriceAdjustment } from "../cart/attribute-price-adjustment";
import { cartVariantDisplayLinesFromPrismaOptions } from "../cart/cart-variant-display-lines";
import { ensureCartItemCustomizationsColumn } from "../utils/db-ensure";

class CartService {
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
    logger.warn("cart_items.customizations column missing; attempting runtime creation");
    return ensureCartItemCustomizationsColumn();
  }

  /**
   * Get or create user's cart
   */
  async getCart(userId: string, locale: string = "en") {
    // Get discount settings
    const discountSettings = await db.settings.findMany({
      where: {
        key: {
          in: ["globalDiscount", "categoryDiscounts"],
        },
      },
    });

    const globalDiscount =
      Number(
        discountSettings.find((s: { key: string; value: unknown }) => s.key === "globalDiscount")?.value
      ) || 0;
    
    const categoryDiscountsSetting = discountSettings.find((s: { key: string; value: unknown }) => s.key === "categoryDiscounts");
    const categoryDiscounts = categoryDiscountsSetting ? (categoryDiscountsSetting.value as Record<string, number>) || {} : {};
    
    const findCart = async () =>
      db.cart.findFirst({
        where: {
          userId,
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  options: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: { select: { key: true } },
                          translations: true,
                        },
                      },
                    },
                  },
                  product: {
                    include: {
                      translations: true,
                      categories: {
                        include: {
                          translations: true,
                        },
                      },
                    },
                  },
                },
              },
              product: {
                include: {
                  translations: true,
                  categories: {
                    include: {
                      translations: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    let cart: Awaited<ReturnType<typeof findCart>>;
    try {
      cart = await findCart();
    } catch (error: unknown) {
      const recovered = await this.ensureCartCustomizationsColumnIfMissing(error);
      if (!recovered) {
        throw error;
      }
      cart = await findCart();
    }

    if (!cart) {
      const createCart = async () =>
        db.cart.create({
          data: {
            userId,
            locale,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            items: {
              create: [],
            },
          },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    options: {
                      include: {
                        attributeValue: {
                          include: {
                            attribute: { select: { key: true } },
                            translations: true,
                          },
                        },
                      },
                    },
                    product: {
                      include: {
                        translations: true,
                      },
                    },
                  },
                },
                product: {
                  include: {
                    translations: true,
                    categories: {
                      include: {
                        translations: true,
                      },
                    },
                  },
                },
              },
            },
          },
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

    const attributeAdjustments = await Promise.all(
      cart.items.map(async (item) => {
        const custom = normalizeProductCustomizations(item.customizations);
        const adj = await sumVerifiedAttributePriceAdjustment(
          item.variantId,
          custom?.selectedAttributeValueIds
        );
        return { itemId: item.id, adj };
      })
    );
    const adjustmentByItemId = new Map(
      attributeAdjustments.map(({ itemId, adj }) => [itemId, adj])
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

        const snapshotRaw = item.priceSnapshot != null ? Number(item.priceSnapshot) : NaN;
        const recomputedAdj = adjustmentByItemId.get(item.id) ?? 0;
        const listPriceBase =
          Number.isFinite(snapshotRaw) && snapshotRaw >= 0
            ? snapshotRaw
            : (variant?.price ?? 0) + recomputedAdj;

        const variantOriginalPrice = listPriceBase;
        let finalPrice = variantOriginalPrice;
        let originalPrice: number | null = null;
        if (appliedDiscount > 0 && variantOriginalPrice > 0) {
          finalPrice = variantOriginalPrice * (1 - appliedDiscount / 100);
          originalPrice = variantOriginalPrice;
        } else if (variant?.compareAtPrice != null) {
          const compareAtAdjusted = Number(variant.compareAtPrice) + recomputedAdj;
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
          customizations: normalizeProductCustomizations(item.customizations),
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
   * Add item to cart
   */
  async addItem(
    userId: string,
    data: {
      variantId: string;
      productId: string;
      quantity?: number;
      customizations?: ProductCustomizations;
    },
    locale: string = "en"
  ) {
    const { variantId, productId, quantity = 1 } = data;
    const normalizedCustomizations = normalizeProductCustomizations(data.customizations);

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
          where: { userId },
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
            userId,
            locale,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

    // Calculate total quantity that will be in cart after adding
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Check if total quantity exceeds available stock
    if (totalQuantity > variant.stock) {
      logger.warn("Cart: stock limit exceeded", {
        variantId,
        currentInCart: existingItem?.quantity ?? 0,
        requestedQuantity: quantity,
        totalQuantity,
        availableStock: variant.stock,
      });
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Insufficient stock",
        detail: `No more stock available. Maximum available: ${variant.stock}, already in cart: ${existingItem?.quantity || 0}, requested: ${quantity}`,
      };
    }

    const attrAdj = await sumVerifiedAttributePriceAdjustment(
      variantId,
      normalizedCustomizations?.selectedAttributeValueIds
    );
    const unitPriceWithAdjustments = Number(variant.price) + attrAdj;

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
  async updateItem(userId: string, itemId: string, quantity: number) {
    if (!quantity || quantity < 1) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation failed",
        detail: "quantity must be at least 1",
      };
    }

    const cart = await db.cart.findFirst({
      where: {
        userId,
        items: {
          some: {
            id: itemId,
          },
        },
      },
      include: {
        items: {
          where: { id: itemId },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Cart item not found",
      };
    }

    const item = cart.items[0];
    const variant = await db.productVariant.findUnique({
      where: { id: item.variantId },
    });

    if (!variant || variant.stock < quantity) {
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Insufficient stock",
        detail: `Requested quantity (${quantity}) exceeds available stock (${variant?.stock || 0})`,
      };
    }

    const updatedItem = await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

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
  async removeItem(userId: string, itemId: string) {
    const cart = await db.cart.findFirst({
      where: {
        userId,
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

    await db.cartItem.delete({
      where: { id: itemId },
    });

    return null;
  }
}

export const cartService = new CartService();

