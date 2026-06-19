export type CartAvailabilityStatus =
  | "available"
  | "insufficient_stock"
  | "out_of_stock"
  | "unavailable"
  | "deleted";

export interface CartDtoItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  lineTotal: number;
  availabilityStatus: CartAvailabilityStatus;
  // Compatibility fields consumed by current storefront flows.
  slug?: string;
  sku?: string;
  stock?: number;
  displayLines?: Array<{ attributeKey: string; valueLabel: string }>;
  customizations?: {
    additions?: string;
    exclusions?: string;
    selectedAttributeValueIds?: string[];
  };
  originalPrice?: number | null;
  categoryId?: string | null;
  category?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
  };
}

export interface CartDto {
  id: string;
  items: CartDtoItem[];
  subtotal: number;
  total: number;
  currency: string;
  updatedAt: string;
}

export interface CartApiResponse {
  cart: CartDto;
}

const DEFAULT_CURRENCY = "AMD";

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date().toISOString();
}

export function createEmptyCartDto(input?: {
  id?: string;
  currency?: string;
  updatedAt?: string | Date;
}): CartDto {
  return {
    id: input?.id ?? "",
    items: [],
    subtotal: 0,
    total: 0,
    currency: input?.currency?.trim() || DEFAULT_CURRENCY,
    updatedAt: toIsoDate(input?.updatedAt),
  };
}

function normalizeCartDtoItem(rawItem: unknown): CartDtoItem | null {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const item = rawItem as Record<string, unknown>;
  const legacyVariant =
    item.variant && typeof item.variant === "object"
      ? (item.variant as Record<string, unknown>)
      : null;
  const legacyProduct =
    legacyVariant?.product && typeof legacyVariant.product === "object"
      ? (legacyVariant.product as Record<string, unknown>)
      : null;

  const id = typeof item.id === "string" ? item.id : "";
  const productId =
    typeof item.productId === "string"
      ? item.productId
      : typeof legacyProduct?.id === "string"
        ? legacyProduct.id
        : "";
  const variantId =
    typeof item.variantId === "string"
      ? item.variantId
      : typeof legacyVariant?.id === "string"
        ? legacyVariant.id
        : "";
  if (!id || !productId || !variantId) {
    return null;
  }

  const quantity = Math.max(0, Math.trunc(toFiniteNumber(item.quantity)));
  const price = toFiniteNumber(item.price);
  const lineTotalRaw = toFiniteNumber(
    typeof item.lineTotal === "number" ? item.lineTotal : item.total
  );
  const lineTotal = lineTotalRaw > 0 ? lineTotalRaw : price * quantity;
  const status = item.availabilityStatus;
  const availabilityStatus: CartAvailabilityStatus =
    status === "insufficient_stock" ||
    status === "out_of_stock" ||
    status === "unavailable" ||
    status === "deleted"
      ? status
      : "available";

  return {
    id,
    productId,
    variantId,
    name:
      typeof item.name === "string"
        ? item.name
        : typeof legacyProduct?.title === "string"
          ? legacyProduct.title
          : "",
    image:
      typeof item.image === "string"
        ? item.image
        : typeof legacyProduct?.image === "string"
          ? legacyProduct.image
          : null,
    price,
    quantity,
    lineTotal,
    availabilityStatus,
    ...(typeof item.slug === "string"
      ? { slug: item.slug }
      : typeof legacyProduct?.slug === "string"
        ? { slug: legacyProduct.slug }
        : {}),
    ...(typeof item.sku === "string"
      ? { sku: item.sku }
      : typeof legacyVariant?.sku === "string"
        ? { sku: legacyVariant.sku }
        : {}),
    ...(typeof item.stock === "number"
      ? { stock: item.stock }
      : typeof legacyVariant?.stock === "number"
        ? { stock: legacyVariant.stock }
        : {}),
    ...(Array.isArray(item.displayLines)
      ? { displayLines: item.displayLines as Array<{ attributeKey: string; valueLabel: string }> }
      : Array.isArray(legacyVariant?.displayLines)
        ? {
            displayLines: legacyVariant.displayLines as Array<{
              attributeKey: string;
              valueLabel: string;
            }>,
          }
      : {}),
    ...(item.customizations && typeof item.customizations === "object"
      ? {
          customizations: item.customizations as {
            additions?: string;
            exclusions?: string;
            selectedAttributeValueIds?: string[];
          },
        }
      : {}),
    ...(typeof item.originalPrice === "number" ? { originalPrice: item.originalPrice } : {}),
    ...(typeof item.categoryId === "string" || item.categoryId === null
      ? { categoryId: item.categoryId }
      : typeof legacyProduct?.categoryId === "string" || legacyProduct?.categoryId === null
        ? { categoryId: legacyProduct.categoryId as string | null }
        : {}),
    ...(() => {
      const rawCategory =
        item.category && typeof item.category === "object"
          ? (item.category as Record<string, unknown>)
          : legacyProduct?.category && typeof legacyProduct.category === "object"
            ? (legacyProduct.category as Record<string, unknown>)
            : null;
      if (!rawCategory) {
        return {};
      }
      return {
        category: {
          ...(typeof rawCategory.id === "string" || rawCategory.id === null
            ? { id: rawCategory.id as string | null }
            : {}),
          ...(typeof rawCategory.slug === "string" || rawCategory.slug === null
            ? { slug: rawCategory.slug as string | null }
            : {}),
          ...(typeof rawCategory.name === "string" || rawCategory.name === null
            ? { name: rawCategory.name as string | null }
            : {}),
        },
      };
    })(),
  };
}

export function coerceCartApiResponse(payload: unknown): CartApiResponse {
  if (!payload || typeof payload !== "object") {
    return { cart: createEmptyCartDto() };
  }

  const candidate = payload as Record<string, unknown>;
  const rawCart = candidate.cart;
  if (!rawCart || typeof rawCart !== "object") {
    return { cart: createEmptyCartDto() };
  }

  const cartRecord = rawCart as Record<string, unknown>;
  const totalsRecord =
    cartRecord.totals && typeof cartRecord.totals === "object"
      ? (cartRecord.totals as Record<string, unknown>)
      : null;
  const items = Array.isArray(cartRecord.items)
    ? cartRecord.items
        .map((item) => normalizeCartDtoItem(item))
        .filter((item): item is CartDtoItem => item !== null)
    : [];

  const subtotal = toFiniteNumber(
    typeof cartRecord.subtotal === "number" ? cartRecord.subtotal : totalsRecord?.subtotal
  );
  const total = toFiniteNumber(
    typeof cartRecord.total === "number" ? cartRecord.total : totalsRecord?.total
  );
  const resolvedSubtotal =
    subtotal > 0 ? subtotal : items.reduce((sum, item) => sum + item.lineTotal, 0);
  const resolvedTotal = total > 0 ? total : resolvedSubtotal;

  return {
    cart: {
      id: typeof cartRecord.id === "string" ? cartRecord.id : "",
      items,
      subtotal: resolvedSubtotal,
      total: resolvedTotal,
      currency:
        typeof cartRecord.currency === "string" && cartRecord.currency.trim().length > 0
          ? cartRecord.currency
          : typeof totalsRecord?.currency === "string" && totalsRecord.currency.trim().length > 0
            ? totalsRecord.currency
            : DEFAULT_CURRENCY,
      updatedAt: toIsoDate(cartRecord.updatedAt),
    },
  };
}
