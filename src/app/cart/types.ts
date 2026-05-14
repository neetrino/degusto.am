import type { CartVariantDisplayLine } from '../../lib/cart/cart-variant-display-lines';

/**
 * Cart item interface
 */
export interface CartItem {  id: string;
  customizations?: {
    additions?: string;
    exclusions?: string;
  };
  variant: {
    id: string;
    sku: string;
    stock?: number;
    /** Variant options (e.g. color, size) for display; preferred over raw SKU. */
    displayLines?: CartVariantDisplayLine[];
    product: {
      id: string;
      title: string;
      slug: string;
      image?: string | null;
    };
  };
  quantity: number;
  price: number;
  originalPrice?: number | null;
  total: number;
}

/**
 * Cart interface
 */
export interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
}

/**
 * Guest cart item interface
 */
export interface GuestCartItem {
  lineId?: string;
  productId: string;
  productSlug?: string;
  variantId: string;
  quantity: number;
  customizations?: {
    additions?: string;
    exclusions?: string;
  };
}




