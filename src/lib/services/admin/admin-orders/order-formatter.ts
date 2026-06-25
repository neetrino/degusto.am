import type { Prisma } from "@prisma/client";
import { resolveOrderLineImageUrl } from "@/lib/utils/extractMediaUrl";
import {
  buildOrderItemVariantOptions,
  type OrderItemVariantOption,
} from "@/lib/services/orders/order-item-display-options";

/**
 * Format order for list response
 */
export function formatOrderForList(order: {
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
  currency: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: Date;
  items?: Array<unknown>;
  _count?: { items: number };
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}) {
  const customer = order.user || null;
  const firstName = customer?.firstName || '';
  const lastName = customer?.lastName || '';

  return {
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
    currency: order.currency || 'AMD',
    customerEmail: customer?.email || order.customerEmail || '',
    customerPhone: customer?.phone || order.customerPhone || '',
    customerFirstName: firstName,
    customerLastName: lastName,
    customerId: customer?.id || null,
    itemsCount:
      order._count?.items ??
      (Array.isArray(order.items) ? order.items.length : 0),
    createdAt: order.createdAt.toISOString(),
  };
}

/**
 * Format order item for detail response
 */
export function formatOrderItem(
  item: {
    id: string;
    variantId: string | null;
    productTitle: string | null;
    sku: string | null;
    quantity: number | null;
    total: number | null;
    imageUrl?: string | null;
    customizations?: unknown;
    variant?: {
      id: string;
      sku: string | null;
      imageUrl?: string | null;
      options?: Array<{
        attributeKey: string | null;
        value: string | null;
        valueId: string | null;
        attributeValue: {
          value: string;
          imageUrl: string | null;
          colors: unknown;
          translations: Array<{
            locale: string;
            label: string;
          }>;
          attribute: {
            key: string;
          };
        } | null;
      }>;
      product?: {
        id: string;
        media?: unknown;
        translations?: Array<{
          title: string;
        }>;
      } | null;
    } | null;
  },
  customizationValueMap: Map<string, OrderItemVariantOption>
) {
  const variant = item.variant;
  const product = variant?.product;
  const translations = product && Array.isArray(product.translations) ? product.translations : [];
  const translation = translations[0] || null;

  const quantity = item.quantity ?? 0;
  const total = item.total ?? 0;
  const unitPrice = quantity > 0 ? Number((total / quantity).toFixed(2)) : total;

  // Per-line customizations (PDP selections) take precedence over static variant options.
  const variantOptions = buildOrderItemVariantOptions(item, customizationValueMap);

  return {
    id: item.id,
    variantId: item.variantId || variant?.id || null,
    productId: product?.id || null,
    productTitle: translation?.title || item.productTitle || "Unknown Product",
    sku: variant?.sku || item.sku || "N/A",
    quantity,
    total,
    unitPrice,
    imageUrl: resolveOrderLineImageUrl(item),
    variantOptions,
  };
}

/**
 * Format order for detail response
 */
export function formatOrderForDetail(
  order: {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  subtotal: number | null;
  discountAmount: number | null;
  shippingAmount: number | null;
  taxAmount: number | null;
  currency: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  billingAddress: Prisma.JsonValue | null;
  shippingAddress: Prisma.JsonValue | null;
  shippingMethod: string | null;
  notes: string | null;
  adminNotes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  items: Array<{
    id: string;
    variantId: string | null;
    productTitle: string | null;
    sku: string | null;
    quantity: number | null;
    total: number | null;
    imageUrl?: string | null;
    customizations?: unknown;
    variant?: {
      id: string;
      sku: string | null;
      imageUrl?: string | null;
      options?: Array<{
        attributeKey: string | null;
        value: string | null;
        valueId: string | null;
        attributeValue: {
          value: string;
          imageUrl: string | null;
          colors: unknown;
          translations: Array<{
            locale: string;
            label: string;
          }>;
          attribute: {
            key: string;
          };
        } | null;
      }>;
      product?: {
        id: string;
        media?: unknown;
        translations?: Array<{
          title: string;
        }>;
      } | null;
    } | null;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    method: string | null;
    amount: number;
    currency: string;
    status: string;
    cardLast4: string | null;
    cardBrand: string | null;
  }>;
  events?: Array<{
    type: string;
    data: Prisma.JsonValue | null;
    createdAt: Date;
  }>;
},
  customizationValueMap: Map<string, OrderItemVariantOption>
) {
  const user = order.user;
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const primaryPayment = payments[0] || null;
  const formattedItems = order.items.map((item) => formatOrderItem(item, customizationValueMap));
  const orderCreatedEvent = Array.isArray(order.events)
    ? order.events
        .filter((event) => event.type === "order_created")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null
    : null;
  const eventData =
    orderCreatedEvent && typeof orderCreatedEvent.data === "object" && orderCreatedEvent.data !== null
      ? (orderCreatedEvent.data as Record<string, unknown>)
      : null;
  const rawBagFeeAmount = eventData?.bagFeeAmount;
  const bagFeeAmount =
    typeof rawBagFeeAmount === "number" && Number.isFinite(rawBagFeeAmount)
      ? Math.max(0, rawBagFeeAmount)
      : 0;

  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total,
    currency: order.currency || "AMD",
    totals: {
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discountAmount || 0),
      shipping: Number(order.shippingAmount || 0),
      bagFee: bagFeeAmount,
      tax: Number(order.taxAmount || 0),
      total: Number(order.total || 0),
      currency: order.currency || "AMD",
    },
    customerEmail: order.customerEmail || user?.email || undefined,
    customerPhone: order.customerPhone || user?.phone || undefined,
    billingAddress: order.billingAddress || null,
    shippingAddress: order.shippingAddress || null,
    shippingMethod: order.shippingMethod || null,
    notes: order.notes || null,
    adminNotes: order.adminNotes || null,
    ipAddress: order.ipAddress || null,
    userAgent: order.userAgent || null,
    payment: primaryPayment
      ? {
          id: primaryPayment.id,
          provider: primaryPayment.provider,
          method: primaryPayment.method ?? "",
          amount: primaryPayment.amount,
          currency: primaryPayment.currency,
          status: primaryPayment.status,
          cardLast4: primaryPayment.cardLast4,
          cardBrand: primaryPayment.cardBrand,
        }
      : null,
    customer: user
      ? {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt?.toISOString?.() ?? undefined,
    items: formattedItems,
  };
}

