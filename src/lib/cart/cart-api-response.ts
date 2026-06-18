import type { ProductCustomizations } from "./customizations";
import {
  createEmptyCartDto,
  type CartApiResponse,
  type CartAvailabilityStatus,
  type CartDtoItem,
} from "./cart-contract";

const DEFAULT_CART_CURRENCY = "AMD";

type CartTotalsLike = {
  subtotal?: number;
  total?: number;
  currency?: string;
};

type ServiceCartLine = {
  id?: string;
  quantity?: number;
  price?: number;
  total?: number;
  originalPrice?: number | null;
  customizations?: ProductCustomizations;
  variant?: {
    id?: string;
    sku?: string | null;
    stock?: number;
    published?: boolean;
    displayLines?: Array<{ attributeKey: string; valueLabel: string }>;
    product?: {
      id?: string;
      title?: string | null;
      slug?: string | null;
      image?: string | null;
      deletedAt?: Date | null;
      published?: boolean;
    };
  };
};

type ServiceCartLike = {
  id?: string;
  updatedAt?: string | Date;
  items?: ServiceCartLine[];
  totals?: CartTotalsLike;
} | null;

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toAvailabilityStatus(item: ServiceCartLine): CartAvailabilityStatus {
  const product = item.variant?.product;
  const stock = toFiniteNumber(item.variant?.stock);
  const quantity = Math.max(0, Math.trunc(toFiniteNumber(item.quantity)));

  if (!item.variant?.id || !product?.id) {
    return "deleted";
  }
  if (product.deletedAt || product.published === false || item.variant?.published === false) {
    return "unavailable";
  }
  if (stock <= 0) {
    return "out_of_stock";
  }
  if (quantity > stock) {
    return "insufficient_stock";
  }
  return "available";
}

function normalizeLineItem(item: ServiceCartLine): CartDtoItem | null {
  const id = typeof item.id === "string" ? item.id : "";
  const productId = item.variant?.product?.id;
  const variantId = item.variant?.id;
  if (!id || !productId || !variantId) {
    return null;
  }

  const quantity = Math.max(0, Math.trunc(toFiniteNumber(item.quantity)));
  const price = toFiniteNumber(item.price);
  const lineTotalRaw = toFiniteNumber(item.total);
  const lineTotal = lineTotalRaw > 0 ? lineTotalRaw : quantity * price;
  const product = item.variant?.product;

  return {
    id,
    productId,
    variantId,
    name: product?.title ?? "",
    image: product?.image ?? null,
    price,
    quantity,
    lineTotal,
    availabilityStatus: toAvailabilityStatus(item),
    slug: product?.slug ?? "",
    sku: item.variant?.sku ?? "",
    stock: item.variant?.stock,
    displayLines: item.variant?.displayLines,
    customizations: item.customizations,
    originalPrice: item.originalPrice ?? null,
  };
}

export function toCartApiStableResponse(cart: ServiceCartLike): CartApiResponse {
  if (!cart) {
    return { cart: createEmptyCartDto() };
  }

  const items = (Array.isArray(cart.items) ? cart.items : [])
    .map((item) => normalizeLineItem(item))
    .filter((item): item is CartDtoItem => item !== null);
  const subtotalFromItems = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotalFromTotals = toFiniteNumber(cart.totals?.subtotal);
  const totalFromTotals = toFiniteNumber(cart.totals?.total);

  const subtotal = subtotalFromTotals > 0 ? subtotalFromTotals : subtotalFromItems;
  const total = totalFromTotals > 0 ? totalFromTotals : subtotal;

  return {
    cart: {
      id: cart.id ?? "",
      items,
      subtotal,
      total,
      currency: cart.totals?.currency?.trim() || DEFAULT_CART_CURRENCY,
      updatedAt:
        typeof cart.updatedAt === "string"
          ? cart.updatedAt
          : cart.updatedAt instanceof Date
            ? cart.updatedAt.toISOString()
            : new Date().toISOString(),
    },
  };
}
