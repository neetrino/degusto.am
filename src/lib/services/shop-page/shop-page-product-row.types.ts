export type ShopMenuProductRow = {
  id: string;
  discountPercent: number | null;
  media: unknown;
  ratingSummary?: {
    avgRating: number;
    reviewCount: number;
  };
  categories: Array<{
    translations: Array<{
      locale: string;
      title: string;
      slug: string;
    }>;
  }>;
  translations: Array<{
    locale: string;
    title: string;
    subtitle?: string | null;
    slug: string;
  }>;
  variants: Array<{
    id: string;
    published?: boolean;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    attributes: unknown;
  }>;
  _count?: {
    variants?: number;
    reviews?: number;
  };
};
