import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";
import { Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import type { CheckoutData } from "../types/checkout";
import { logger } from "../utils/logger";
import { COUPON_CODE_REGEX } from "../coupon-code-format";
import { extractMediaUrl } from "../utils/extractMediaUrl";
import { adminService } from "./admin.service";
import {
  formatCustomizationsForVariantTitle,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from "../cart/customizations";
import { isStockSufficient } from "../product-stock";
import { sumLineCustomizationPriceAdjustment } from "../cart/attribute-price-adjustment";
import { calculateBagAmountByUniqueCategories } from "../cart/bag-fee";

const orderNumberId = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 10);
const ALLOWED_SHIPPING_METHODS = ["pickup", "delivery"] as const;
const ALLOWED_PAYMENT_METHODS = ["idram", "arca", "cash_on_delivery"] as const;

type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        translations: true;
        categories: {
          include: {
            translations: true;
          };
        };
      };
    };
    variant: {
      include: {
        options: true;
      };
    };
  };
}>;

type CheckoutCartItem = {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  productTitle: string;
  variantTitle?: string;
  sku: string;
  imageUrl?: string;
  customizations?: ProductCustomizations;
  categoryId?: string | null;
  category?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
  };
};

type AppliedCouponResult = {
  code: string;
  discountAmount: number;
};

type CheckoutComputationResult = {
  appliedCoupon: AppliedCouponResult | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  shippingAmount: number;
  deliveryPriceAmount: number;
  bagFeeAmount: number;
  taxAmount: number;
  mergedNotes: string;
  normalizedCashChangeFrom: number | undefined;
};

type CheckoutTransactionResult = {
  order: {
    id: string;
    number: string;
    status: string;
    paymentStatus: string;
    total: number;
    currency: string;
  };
  payment: {
    provider: string;
  };
};

function generateOrderNumber(): string {
  const now = new Date();
  const ymd =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `${ymd}-${orderNumberId()}`;
}

function buildPaymentUrl(params: {
  provider: string;
  orderNumber: string;
  total: number;
  currency: string;
  isGuest: boolean;
}): string | null {
  if (params.provider !== "idram" && params.provider !== "arca") {
    return null;
  }

  const externalBase =
    params.provider === "idram"
      ? process.env.IDRAM_CHECKOUT_URL
      : process.env.ARCA_CHECKOUT_URL;

  if (externalBase) {
    const url = new URL(externalBase);
    url.searchParams.set("orderNumber", params.orderNumber);
    url.searchParams.set("amount", String(params.total));
    url.searchParams.set("currency", params.currency);
    return url.toString();
  }

  const localPath = `/checkout/payment-gateway?provider=${encodeURIComponent(
    params.provider
  )}&order=${encodeURIComponent(params.orderNumber)}&guest=${params.isGuest ? "1" : "0"}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!appUrl) {
    return localPath;
  }
  return new URL(localPath, appUrl).toString();
}

function normalizeCouponCode(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }
  const normalized = input.trim();
  if (!normalized) {
    return null;
  }
  if (!COUPON_CODE_REGEX.test(normalized)) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "couponCode format is invalid",
    };
  }
  return normalized;
}

function normalizeQuantity(input: unknown): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Item quantity must be a valid number",
    };
  }
  const quantity = Math.floor(input);
  if (quantity < 1 || quantity > 999) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Item quantity must be between 1 and 999",
    };
  }
  return quantity;
}

function validateCheckoutInput(params: {
  email?: string;
  phone?: string;
  shippingMethod: string;
  paymentMethod: string;
  shippingAddress?: { city?: string | null } | null;
}): void {
  const { email, phone, shippingMethod, paymentMethod, shippingAddress } = params;

  if (!email || !phone) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Email and phone are required",
    };
  }
  if (!ALLOWED_SHIPPING_METHODS.includes(shippingMethod as (typeof ALLOWED_SHIPPING_METHODS)[number])) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Invalid shipping method",
    };
  }
  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number])) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Invalid payment method",
    };
  }
  if (shippingMethod === "delivery" && !shippingAddress?.city?.trim()) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Shipping city is required for delivery orders",
    };
  }
}

async function getDbCartItems(
  cartId: string,
  owner: { userId?: string; guestToken?: string }
): Promise<CheckoutCartItem[]> {
  const cart = await db.cart.findFirst({
    where: {
      id: cartId,
      ...(owner.userId ? { userId: owner.userId } : { guestToken: owner.guestToken }),
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
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
              options: true,
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

  if (!cart || cart.items.length === 0) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Cart is empty",
      detail: "Cannot checkout with an empty cart",
    };
  }

  return Promise.all(
    cart.items.map(async (item: CartItemWithRelations) => {
      const product = item.product;
      const variant = item.variant;
      if (!variant) {
        throw {
          status: 404,
          type: problemTypes.notFound,
          title: "Variant not found",
          detail: `Variant ${item.variantId} not found for cart item`,
        };
      }

      const safeQuantity = normalizeQuantity(item.quantity);
      if (!isStockSufficient(variant.stock, safeQuantity)) {
        const translation = product.translations?.[0] || product.translations?.[0];
        throw {
          status: 422,
          type: problemTypes.validationError,
          title: "Insufficient stock",
          detail: `Product "${translation?.title || "Unknown"}" - insufficient stock. Available: ${variant.stock}, Requested: ${safeQuantity}`,
        };
      }

      const translation = product.translations?.[0] || product.translations?.[0];
      const variantTitle =
        variant.options?.map((opt) => `${opt.attributeKey || ""}: ${opt.value || ""}`).join(", ") ||
        undefined;
      const customizations = normalizeProductCustomizations(item.customizations);
      const customizationsSuffix = formatCustomizationsForVariantTitle(customizations);
      const imageUrl = extractMediaUrl(product.media) ?? undefined;
      const primaryCategory =
        product.categories?.find((category) => category.id === product.primaryCategoryId) ??
        product.categories?.[0];
      const categoryTranslation = primaryCategory?.translations?.[0];

      const snapshotRaw = item.priceSnapshot != null ? Number(item.priceSnapshot) : NaN;
      const unitPrice =
        Number.isFinite(snapshotRaw) && snapshotRaw >= 0 ? snapshotRaw : Number(variant.price);

      return {
        variantId: variant.id,
        productId: product.id,
        quantity: safeQuantity,
        price: unitPrice,
        productTitle: translation?.title || "Unknown Product",
        variantTitle: customizationsSuffix
          ? `${variantTitle || ""}${variantTitle ? " | " : ""}${customizationsSuffix}`
          : variantTitle,
        sku: variant.sku || "",
        imageUrl,
        customizations,
        categoryId: product.primaryCategoryId,
        category: primaryCategory
          ? {
              id: primaryCategory.id,
              slug: categoryTranslation?.slug,
              name: categoryTranslation?.title,
            }
          : undefined,
      };
    })
  );
}

async function getGuestCartItems(
  guestItems: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    customizations?: ProductCustomizations;
  }>
): Promise<CheckoutCartItem[]> {
  const variantIds: string[] = [];
  for (const item of guestItems) {
    if (!item.productId || !item.variantId) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation Error",
        detail: "Each item must have productId, variantId, and quantity",
      };
    }
    normalizeQuantity(item.quantity);
    variantIds.push(item.variantId);
  }

  const variants = await db.productVariant.findMany({
    where: {
      id: { in: [...new Set(variantIds)] },
      published: true,
      product: {
        published: true,
        deletedAt: null,
      },
    },
    include: {
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
      options: true,
    },
  });
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  return Promise.all(
    guestItems.map(async (item) => {
      const safeQuantity = normalizeQuantity(item.quantity);
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.productId !== item.productId || !variant.published || !variant.product) {
        throw {
          status: 404,
          type: problemTypes.notFound,
          title: "Product variant not found",
          detail: `Variant ${item.variantId} not found for product ${item.productId}`,
        };
      }
      if (!isStockSufficient(variant.stock, safeQuantity)) {
        throw {
          status: 422,
          type: problemTypes.validationError,
          title: "Insufficient stock",
          detail: `Insufficient stock. Available: ${variant.stock}, Requested: ${safeQuantity}`,
        };
      }

      const translation = variant.product.translations?.[0] || variant.product.translations?.[0];
      const variantTitle =
        variant.options
          ?.map((opt: { attributeKey?: string | null; value?: string | null }) => {
            return `${opt.attributeKey ?? ""}: ${opt.value ?? ""}`;
          })
          .join(", ") ?? undefined;
      const customizations = normalizeProductCustomizations(item.customizations);
      const customizationsSuffix = formatCustomizationsForVariantTitle(customizations);
      const imageUrl = extractMediaUrl(variant.product.media) ?? undefined;
      const primaryCategory =
        variant.product.categories?.find(
          (category) => category.id === variant.product.primaryCategoryId
        ) ?? variant.product.categories?.[0];
      const categoryTranslation = primaryCategory?.translations?.[0];

      const adj = await sumLineCustomizationPriceAdjustment(
        item.variantId,
        customizations
      );
      const price = Number(variant.price) + adj;

      return {
        variantId: variant.id,
        productId: variant.product.id,
        quantity: safeQuantity,
        price,
        productTitle: translation?.title ?? "Unknown Product",
        variantTitle: customizationsSuffix
          ? `${variantTitle || ""}${variantTitle ? " | " : ""}${customizationsSuffix}`
          : variantTitle,
        sku: variant.sku ?? "",
        imageUrl,
        customizations,
        categoryId: variant.product.primaryCategoryId,
        category: primaryCategory
          ? {
              id: primaryCategory.id,
              slug: categoryTranslation?.slug,
              name: categoryTranslation?.title,
            }
          : undefined,
      };
    })
  );
}

async function resolveCartItems(params: {
  userId?: string;
  guestToken?: string | null;
  cartId?: string;
  guestItems?: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    customizations?: ProductCustomizations;
  }>;
}): Promise<CheckoutCartItem[]> {
  const { userId, guestToken, cartId, guestItems } = params;
  if (cartId && cartId !== "guest-cart") {
    if (userId) {
      return getDbCartItems(cartId, { userId });
    }
    if (guestToken) {
      return getDbCartItems(cartId, { guestToken });
    }
  }
  if (guestItems && Array.isArray(guestItems) && guestItems.length > 0) {
    return await getGuestCartItems(guestItems);
  }
  throw {
    status: 400,
    type: problemTypes.validationError,
    title: "Cart is empty",
    detail: "Cannot checkout with an empty cart",
  };
}

async function computeCheckout(params: {
  cartItems: CheckoutCartItem[];
  shippingMethod: string;
  shippingAddress?: { city?: string | null } | null;
  paymentMethod: string;
  couponCode?: string;
  cashChangeFrom?: number;
  notes?: string;
  resolveCouponDiscount: (subtotal: number, couponCode: string | null) => Promise<AppliedCouponResult | null>;
}): Promise<CheckoutComputationResult> {
  const {
    cartItems,
    shippingMethod,
    shippingAddress,
    paymentMethod,
    couponCode,
    cashChangeFrom,
    notes,
    resolveCouponDiscount,
  } = params;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const normalizedCouponCode = normalizeCouponCode(couponCode);
  const appliedCoupon = await resolveCouponDiscount(subtotal, normalizedCouponCode);
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const bagFeeAmount = calculateBagAmountByUniqueCategories(cartItems, (item) => ({
    categoryId: item.categoryId,
    category: item.category,
  }));

  let shippingAmount = 0;
  let deliveryPriceAmount = 0;
  if (shippingMethod === "delivery") {
    const city = shippingAddress?.city?.trim() || "";
    const resolvedDeliveryPrice = await adminService.getDeliveryPrice(city, "Հայաստան");
    if (resolvedDeliveryPrice <= 0) {
      throw {
        status: 422,
        type: problemTypes.validationError,
        title: "Validation Error",
        detail: "Delivery is unavailable for selected city",
      };
    }
    deliveryPriceAmount = resolvedDeliveryPrice;
    shippingAmount = deliveryPriceAmount + bagFeeAmount;
  } else {
    shippingAmount = bagFeeAmount;
  }

  const taxAmount = 0;
  const total = subtotal - discountAmount + shippingAmount + taxAmount;
  const normalizedCashChangeFrom =
    typeof cashChangeFrom === "number" && Number.isFinite(cashChangeFrom) && cashChangeFrom > 0
      ? Math.round(cashChangeFrom)
      : undefined;
  if (
    paymentMethod === "cash_on_delivery" &&
    typeof normalizedCashChangeFrom === "number" &&
    normalizedCashChangeFrom < total
  ) {
    throw {
      status: 400,
      type: problemTypes.validationError,
      title: "Validation Error",
      detail: "Cash change amount must be greater than or equal to order total",
    };
  }

  const notesParts: string[] = [];
  if (typeof notes === "string" && notes.trim()) {
    notesParts.push(notes.trim().slice(0, 500));
  }
  if (appliedCoupon) {
    notesParts.push(`Coupon code: ${appliedCoupon.code}`);
  }
  if (typeof normalizedCashChangeFrom === "number") {
    notesParts.push(`Cash change requested from: ${normalizedCashChangeFrom} AMD`);
  }

  return {
    appliedCoupon,
    discountAmount,
    subtotal,
    total,
    shippingAmount,
    deliveryPriceAmount,
    bagFeeAmount,
    taxAmount,
    mergedNotes: notesParts.join("\n"),
    normalizedCashChangeFrom,
  };
}

async function createOrderAndPayment(params: {
  orderNumber: string;
  userId?: string;
  cartId?: string;
  email: string;
  phone: string;
  shippingMethod: string;
  shippingAddress?: unknown;
  paymentMethod: string;
  cartItems: CheckoutCartItem[];
  computed: CheckoutComputationResult;
}): Promise<CheckoutTransactionResult> {
  const {
    orderNumber,
    userId,
    cartId,
    email,
    phone,
    shippingMethod,
    shippingAddress,
    paymentMethod,
    cartItems,
    computed,
  } = params;

  const transactionResult = await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          number: orderNumber,
          userId: userId || null,
          status: "pending",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
          subtotal: computed.subtotal,
          discountAmount: computed.discountAmount,
          shippingAmount: computed.shippingAmount,
          taxAmount: computed.taxAmount,
          total: computed.total,
          currency: "AMD",
          customerEmail: email,
          customerPhone: phone,
          customerLocale: "en",
          shippingMethod,
          shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          billingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
          notes: computed.mergedNotes || null,
          items: {
            create: cartItems.map((item) => ({
              variantId: item.variantId,
              productTitle: item.productTitle,
              variantTitle: item.variantTitle,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              imageUrl: item.imageUrl,
              customizations: item.customizations as Prisma.InputJsonValue | undefined,
            })),
          },
          events: {
            create: {
              type: "order_created",
              data: {
                source: userId ? "user" : "guest",
                paymentMethod,
                shippingMethod,
                couponCode: computed.appliedCoupon?.code ?? null,
                discountAmount: computed.discountAmount,
                deliveryPriceAmount: computed.deliveryPriceAmount,
                bagFeeAmount: computed.bagFeeAmount,
                cashChangeFrom: computed.normalizedCashChangeFrom ?? null,
              },
            },
          },
        },
        include: {
          items: true,
        },
      });

      for (const item of cartItems) {
        if (!item.variantId) {
          throw {
            status: 400,
            type: problemTypes.validationError,
            title: "Validation Error",
            detail: `Missing variantId for item with SKU: ${item.sku}`,
          };
        }

        const quantity = Number(item.quantity);
        const variantId = item.variantId;
        const updated = await tx.$executeRaw(
          Prisma.sql`UPDATE product_variants SET stock = stock - ${quantity} WHERE id = ${variantId} AND stock >= ${quantity}`
        );
        if (updated === 0) {
          const variant = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: { sku: true, stock: true },
          });
          throw {
            status: 422,
            type: problemTypes.validationError,
            title: "Insufficient stock",
            detail: `Insufficient stock for SKU ${variant?.sku ?? variantId}. Available: ${variant?.stock ?? 0}, requested: ${quantity}`,
          };
        }
      }

      const payment = await tx.payment.create({
        data: {
          orderId: newOrder.id,
          provider: paymentMethod,
          method: paymentMethod,
          amount: computed.total,
          currency: "AMD",
          status: "pending",
        },
      });

      if (cartId && cartId !== "guest-cart") {
        await tx.cart.delete({
          where: { id: cartId },
        });
      }

      return { order: newOrder, payment };
    },
    { timeout: 10000, maxWait: 5000 }
  );

  return {
    order: {
      id: transactionResult.order.id,
      number: transactionResult.order.number,
      status: transactionResult.order.status,
      paymentStatus: transactionResult.order.paymentStatus,
      total: transactionResult.order.total,
      currency: transactionResult.order.currency,
    },
    payment: {
      provider: transactionResult.payment.provider,
    },
  };
}

export async function performCheckout(params: {
  data: CheckoutData;
  userId?: string;
  guestToken?: string | null;
  resolveCouponDiscount: (subtotal: number, couponCode: string | null) => Promise<AppliedCouponResult | null>;
}) {
  const { data, userId, guestToken, resolveCouponDiscount } = params;
  try {
    const {
      cartId,
      items: guestItems,
      email,
      phone,
      shippingMethod = "pickup",
      shippingAddress,
      paymentMethod = "idram",
      couponCode,
      cashChangeFrom,
      notes,
    } = data;

    validateCheckoutInput({
      email,
      phone,
      shippingMethod,
      paymentMethod,
      shippingAddress,
    });

    const cartItems = await resolveCartItems({
      userId,
      guestToken,
      cartId,
      guestItems,
    });
    if (cartItems.length === 0) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Cart is empty",
        detail: "Cannot checkout with an empty cart",
      };
    }

    const computed = await computeCheckout({
      cartItems,
      shippingMethod,
      shippingAddress,
      paymentMethod,
      couponCode,
      cashChangeFrom,
      notes,
      resolveCouponDiscount,
    });

    const orderNumber = generateOrderNumber();
    const created = await createOrderAndPayment({
      orderNumber,
      userId,
      cartId,
      email,
      phone,
      shippingMethod,
      shippingAddress,
      paymentMethod,
      cartItems,
      computed,
    });

    const paymentUrl = buildPaymentUrl({
      provider: created.payment.provider,
      orderNumber: created.order.number,
      total: created.order.total,
      currency: created.order.currency,
      isGuest: !userId,
    });

    return {
      order: created.order,
      payment: {
        provider: created.payment.provider,
        paymentUrl,
        expiresAt: null,
      },
      nextAction:
        paymentMethod === "idram" || paymentMethod === "arca" ? "redirect_to_payment" : "view_order",
      ...(computed.appliedCoupon
        ? {
            coupon: {
              code: computed.appliedCoupon.code,
              discountAmount: computed.appliedCoupon.discountAmount,
            },
          }
        : {}),
    };
  } catch (error: unknown) {
    const customError = error as {
      status?: number;
      type?: string;
      message?: string;
      code?: string;
      name?: string;
      meta?: unknown;
      stack?: string;
    };

    if (customError.status && customError.type) {
      throw error;
    }

    logger.error("Checkout error", {
      error: {
        name: customError?.name,
        message: customError?.message,
        code: customError?.code,
        meta: customError?.meta,
        stack: customError?.stack?.substring(0, 500),
      },
    });

    if (customError?.code === "P2002") {
      throw {
        status: 409,
        type: problemTypes.conflict,
        title: "Conflict",
        detail: "Order number already exists, please try again",
      };
    }

    throw {
      status: 500,
      type: problemTypes.internalError,
      title: "Internal Server Error",
      detail: customError?.message || "An error occurred during checkout",
    };
  }
}
