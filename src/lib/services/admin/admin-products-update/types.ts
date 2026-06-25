/**
 * Update product data interface
 */
export interface UpdateProductData {
  title?: string;
  slug?: string;
  subtitle?: string;
  descriptionHtml?: string;
  primaryCategoryId?: string;
  categoryIds?: string[];
  published?: boolean;
  featured?: boolean;
  locale?: string;
  media?: unknown[];
  labels?: Array<{
    id?: string;
    type: string;
    value: string;
    position: string;
    color?: string | null;
  }>;
  attributeIds?: string[];
  pdpCustomization?: { items: Array<{ valueId: string; role: 'default' | 'addon' }> } | null;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
  variants?: Array<{
    id?: string;
    price: string | number;
    compareAtPrice?: string | number;
    stock: string | number;
    sku?: string;
    color?: string;
    size?: string;
    imageUrl?: string;
    published?: boolean;
    options?: Array<{
      attributeKey: string;
      value: string;
      valueId?: string;
    }>;
  }>;
}




