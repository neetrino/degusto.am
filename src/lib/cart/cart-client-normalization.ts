import type { Cart, CartItem } from "@/app/cart/types";
import {
  coerceCartApiResponse,
  createEmptyCartDto,
  type CartApiResponse,
  type CartDto,
  type CartDtoItem,
} from "@/lib/cart/cart-contract";
import type { ProductCustomizations } from "@/lib/cart/customizations";
import { buildCustomizationLineKey } from "@/lib/cart/customizations";

function mapDtoItemToCartItem(item: CartDtoItem): CartItem {
  return {
    id: item.id,
    customizations: item.customizations as ProductCustomizations | undefined,
    variant: {
      id: item.variantId,
      sku: item.sku ?? "",
      stock: item.stock,
      displayLines: item.displayLines,
      product: {
        id: item.productId,
        title: item.name,
        slug: item.slug ?? item.productId,
        image: item.image,
        categoryId: item.categoryId ?? null,
        category: item.category,
      },
    },
    quantity: item.quantity,
    price: item.price,
    originalPrice: item.originalPrice ?? null,
    total: item.lineTotal,
    availabilityStatus: item.availabilityStatus,
  };
}

function computeItemsCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function normalizeCartDtoToClientCart(dto: CartDto): Cart {
  const items = dto.items.map((item) => mapDtoItemToCartItem(item));
  const itemsCount = computeItemsCount(items);
  const subtotal = Number.isFinite(dto.subtotal)
    ? dto.subtotal
    : items.reduce((sum, item) => sum + item.total, 0);
  const total = Number.isFinite(dto.total) ? dto.total : subtotal;

  return {
    id: dto.id,
    items,
    subtotal,
    totals: {
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total,
      currency: dto.currency,
    },
    itemsCount,
    updatedAt: dto.updatedAt,
  };
}

export function normalizeCartApiResponse(payload: unknown): Cart {
  const response = coerceCartApiResponse(payload);
  return normalizeCartDtoToClientCart(response.cart);
}

export function normalizeCartApiEnvelope(payload: unknown): CartApiResponse {
  return coerceCartApiResponse(payload);
}

export function createEmptyClientCart(currency?: string): Cart {
  return normalizeCartDtoToClientCart(createEmptyCartDto({ currency }));
}

export function findCartLineByContext(
  cart: Cart,
  input: {
    productId: string;
    variantId: string;
    customizations?: ProductCustomizations;
  }
): CartItem | null {
  const targetKey = buildCustomizationLineKey(input.variantId, input.customizations);
  const match = cart.items.find(
    (item) =>
      item.variant.product.id === input.productId &&
      buildCustomizationLineKey(item.variant.id, item.customizations) === targetKey
  );
  return match ?? null;
}
