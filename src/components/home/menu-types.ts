export type MenuCard = {
  id: string;
  slug: string;
  titleKey: string;
  subtitleKey: string;
  title?: string;
  subtitle?: string;
  category?: string;
  categoryKey?: string;
  image?: string | null;
  price: number;
  oldPrice: number;
  discount: string;
  discountPercent?: number | null;
  inStock?: boolean;
  defaultVariantId?: string | null;
  supportsSpicy?: boolean;
  supportsGreens?: boolean;
};

export type MenuCategory = {
  id: string;
  slug: string;
  title: string;
  iconUrl?: string | null;
  productCount?: number;
};
