import type { CartVariantDisplayLine } from '../../lib/cart/cart-variant-display-lines';
import type { CartAvailabilityStatus } from '../../lib/cart/cart-contract';

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
  availabilityStatus?: CartAvailabilityStatus;
}

/**
 * Cart interface
 */
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal?: number;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
  updatedAt?: string;
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




