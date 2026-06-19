export type HomeFeaturedProduct = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  categorySlug?: string;
  price: number | null;
  oldPrice: number | null;
  image: string | null;
  discountPercent: number | null;
  rating?: number | null;
  inStock?: boolean;
  defaultVariantId?: string | null;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

export type HomeCategoryItem = {
  id: string;
  slug: string;
  title: string;
  count: number;
  image: string;
};
