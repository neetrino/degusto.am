import { db } from "@white-shop/db";
import { Prisma } from "@prisma/client";
import type { CheckoutData } from "../types/checkout";
import { COUPON_CODE_REGEX } from "../coupon-code-format";
import { convertPrice } from "../currency";
import { logger } from "../utils/logger";
import { cartService } from "./cart.service";
import { normalizeProductCustomizations } from "../cart/customizations";
import { performCheckout } from "./orders.checkout";

/** Cart/order line subtotals use `ProductVariant.price`, stored in USD after admin save. */
const COUPON_SUBTOTAL_CURRENCY = "USD" as const;
/** Promocode minimum order and fixed discount amounts are entered in storefront AMD. */
const COUPON_CATALOG_MONETARY_CURRENCY = "AMD" as const;

type OrderItemWithVariant = Prisma.OrderItemGetPayload<{
  include: {
    variant: {
      include: {
        options: {
          include: {
            attributeValue: {
              include: {
                translations: true;
                attribute: true;
              };
            };
          };
        };
      };
    };
  };
}>;

interface StoredCoupon {
  code: string;
  description?: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  isActive?: boolean;
  startsAt?: string;
  expiresAt?: string;
  minOrderAmount?: number;
  maxUsesPerUser?: number;
}

interface AppliedCouponResult {
  code: string;
  discountAmount: number;
}

function toDateOrNull(input: string | undefined): Date | null {
  if (!input) {
    return null;
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

class OrdersService {
  /**
   * Create order (checkout)
   */
  async checkout(data: CheckoutData, userId?: string) {
    return performCheckout({
      data,
      userId,
      resolveCouponDiscount: (subtotal, couponCode) => {
        return this.resolveCouponDiscount(subtotal, couponCode, {
          userId,
          customerEmail: data.email,
        });
      },
    });
  }

  async previewCouponDiscount(subtotal: number, couponCode: string) {
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "subtotal must be a valid non-negative number",
      };
    }

    const trimmedCouponCode = couponCode.trim();
    if (!COUPON_CODE_REGEX.test(trimmedCouponCode)) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "couponCode format is invalid",
      };
    }

    const appliedCoupon = await this.resolveCouponDiscount(subtotal, trimmedCouponCode);
    if (!appliedCoupon) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Coupon code is invalid",
      };
    }

    const totalAfterDiscount = Math.max(
      0,
      Math.round((subtotal - appliedCoupon.discountAmount) * 100) / 100
    );

    return {
      data: {
        code: appliedCoupon.code,
        discountAmount: appliedCoupon.discountAmount,
        totalAfterDiscount,
      },
    };
  }

  private async resolveCouponDiscount(
    subtotal: number,
    couponCode: string | null,
    options?: { userId?: string; customerEmail?: string }
  ): Promise<AppliedCouponResult | null> {
    if (!couponCode) {
      return null;
    }

    const couponSettings = await db.settings.findUnique({
      where: { key: "couponsCatalog" },
      select: { value: true },
    });
    const rawCoupons = Array.isArray(couponSettings?.value)
      ? (couponSettings.value as unknown[])
      : [];
    const now = new Date();
    const coupon = rawCoupons.find((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }
      const raw = item as StoredCoupon;
      return String(raw.code ?? "").trim() === couponCode;
    }) as StoredCoupon | undefined;

    if (!coupon) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Coupon code is invalid",
      };
    }

    const startsAt = toDateOrNull(coupon.startsAt);
    const expiresAt = toDateOrNull(coupon.expiresAt);
    const isEnabledByWindow = (!startsAt || startsAt <= now) && (!expiresAt || expiresAt >= now);
    if ((coupon.isActive ?? true) !== true || !isEnabledByWindow) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Coupon is inactive or expired",
      };
    }

    const minOrderAmountAmd =
      typeof coupon.minOrderAmount === "number" && Number.isFinite(coupon.minOrderAmount)
        ? coupon.minOrderAmount
        : 0;
    if (minOrderAmountAmd > 0) {
      const subtotalAmd = Math.round(
        convertPrice(subtotal, COUPON_SUBTOTAL_CURRENCY, COUPON_CATALOG_MONETARY_CURRENCY)
      );
      if (subtotalAmd < minOrderAmountAmd) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: `Coupon requires minimum order amount of ${minOrderAmountAmd} AMD`,
        };
      }
    }

    const maxUsesPerUser =
      typeof coupon.maxUsesPerUser === "number" &&
      Number.isFinite(coupon.maxUsesPerUser) &&
      Number.isInteger(coupon.maxUsesPerUser) &&
      coupon.maxUsesPerUser > 0
        ? coupon.maxUsesPerUser
        : null;
    const matchedCode = String(coupon.code ?? "").trim();

    if (maxUsesPerUser !== null) {
      const hasUserIdentity = Boolean(options?.userId || options?.customerEmail);
      if (hasUserIdentity) {
        const usageFilter: Prisma.OrderWhereInput = {
          notes: {
            contains: `Coupon code: ${matchedCode}`,
          },
        };

        if (options?.userId) {
          usageFilter.userId = options.userId;
        } else if (options?.customerEmail) {
          usageFilter.customerEmail = options.customerEmail;
        }

        const usedCount = await db.order.count({ where: usageFilter });
        if (usedCount >= maxUsesPerUser) {
          throw {
            status: 400,
            type: "https://api.shop.am/problems/validation-error",
            title: "Validation Error",
            detail: `Coupon usage limit reached for this user (${maxUsesPerUser})`,
          };
        }
      }
    }

    const discountType = coupon.discountType === "fixed" ? "fixed" : "percent";
    const discountValue =
      typeof coupon.discountValue === "number" && Number.isFinite(coupon.discountValue)
        ? coupon.discountValue
        : 0;
    const calculatedDiscount =
      discountType === "percent"
        ? subtotal * (Math.min(100, Math.max(0, discountValue)) / 100)
        : convertPrice(
            Math.max(0, discountValue),
            COUPON_CATALOG_MONETARY_CURRENCY,
            COUPON_SUBTOTAL_CURRENCY
          );
    const safeDiscount = Math.min(subtotal, Math.max(0, calculatedDiscount));
    const roundedDiscount = Math.round(safeDiscount * 100) / 100;

    return {
      code: matchedCode,
      discountAmount: roundedDiscount,
    };
  }

  /**
   * Get user orders list (paginated)
   */
  async list(userId: string, options?: { page?: number; limit?: number }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId },
        include: {
          items: { select: { id: true } },
          payments: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where: { userId } }),
    ]);

    return {
      data: orders.map((order: {
        id: string;
        number: string;
        status: string;
        paymentStatus: string;
        fulfillmentStatus: string;
        total: number;
        subtotal: number;
        discountAmount: number;
        shippingAmount: number;
        taxAmount: number;
        currency: string;
        createdAt: Date;
        items: Array<{ id: string }>;
      }) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        total: order.total,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        taxAmount: order.taxAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        itemsCount: order.items.length,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get order by number
   */
  async findByNumber(orderNumber: string, userId: string) {
    const order = await db.order.findFirst({
      where: {
        number: orderNumber,
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
                        attribute: true,
                        translations: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: true,
        events: true,
      },
    });

    if (!order) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with number '${orderNumber}' not found`,
      };
    }

    // Parse shipping address if it's a JSON string
    let shippingAddress = order.shippingAddress;
    if (typeof shippingAddress === 'string') {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch {
        shippingAddress = null;
      }
    }

    // Debug logging
    logger.info('Order found', {
      orderNumber: order.number,
      itemsCount: order.items.length,
      items: order.items.map((item: OrderItemWithVariant) => ({
        variantId: item.variantId,
        productTitle: item.productTitle,
        variant: item.variant ? {
          id: item.variant.id,
          optionsCount: item.variant.options?.length || 0,
          options: item.variant.options,
        } : null,
      })),
    });

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      items: order.items.map((item: OrderItemWithVariant) => {
        const variantOptions = item.variant?.options?.map((opt) => {
          // Debug logging for each option
          logger.debug('Processing option', {
            attributeKey: opt.attributeKey,
            value: opt.value,
            valueId: opt.valueId,
            hasAttributeValue: !!opt.attributeValue,
            attributeValueData: opt.attributeValue ? {
              value: opt.attributeValue.value,
              attributeKey: opt.attributeValue.attribute.key,
              imageUrl: opt.attributeValue.imageUrl,
              hasTranslations: opt.attributeValue.translations?.length > 0,
            } : null,
          });

          // New format: Use AttributeValue if available
          if (opt.attributeValue) {
            // Get label from translations (prefer current locale, fallback to first available)
            const translations = opt.attributeValue.translations || [];
            const label = translations.length > 0 ? translations[0].label : opt.attributeValue.value;
            
            return {
              attributeKey: opt.attributeValue.attribute.key || undefined,
              value: opt.attributeValue.value || undefined,
              label: label || undefined,
              imageUrl: opt.attributeValue.imageUrl || undefined,
              colors: opt.attributeValue.colors || undefined,
            };
          }
          // Old format: Use attributeKey and value directly
          return {
            attributeKey: opt.attributeKey || undefined,
            value: opt.value || undefined,
          };
        }) || [];

        logger.debug('Item mapping', {
          productTitle: item.productTitle,
          variantId: item.variantId,
          hasVariant: !!item.variant,
          optionsCount: item.variant?.options?.length || 0,
          variantOptions,
        });

        return {
          variantId: item.variantId || '',
          productTitle: item.productTitle,
          variantTitle: item.variantTitle || '',
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          imageUrl: item.imageUrl || undefined,
          variantOptions,
        };
      }),
      totals: {
        subtotal: Number(order.subtotal),
        discount: Number(order.discountAmount),
        shipping: Number(order.shippingAmount),
        tax: Number(order.taxAmount),
        total: Number(order.total),
        currency: order.currency,
      },
      customer: {
        email: order.customerEmail || undefined,
        phone: order.customerPhone || undefined,
      },
      shippingAddress: shippingAddress,
      shippingMethod: order.shippingMethod || 'pickup',
      trackingNumber: order.trackingNumber || undefined,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  /**
   * Reorder by order number (adds available items to user's cart).
   */
  async reorderByNumber(orderNumber: string, userId: string) {
    const order = await db.order.findFirst({
      where: {
        number: orderNumber,
        userId,
      },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                productId: true,
                published: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with number '${orderNumber}' not found`,
      };
    }

    if (order.items.length === 0) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Order has no items",
        detail: "Cannot reorder an empty order",
      };
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const item of order.items) {
      const variant = item.variant;
      if (!variant || !variant.published || !item.variantId || !variant.productId) {
        skippedCount += 1;
        continue;
      }

      try {
        await cartService.addItem(
          userId,
          {
            variantId: item.variantId,
            productId: variant.productId,
            quantity: Math.max(1, item.quantity),
            customizations: normalizeProductCustomizations(item.customizations),
          },
          "en"
        );
        addedCount += 1;
      } catch (error: unknown) {
        logger.warn("Reorder item skipped", {
          orderNumber,
          variantId: item.variantId,
          error,
        });
        skippedCount += 1;
      }
    }

    if (addedCount === 0) {
      throw {
        status: 422,
        type: "https://api.shop.am/problems/validation-error",
        title: "Reorder failed",
        detail: "No items from this order are currently available",
      };
    }

    return {
      orderNumber,
      addedCount,
      skippedCount,
      totalItems: order.items.length,
    };
  }
}

export const ordersService = new OrdersService();

