type LocaleTranslation = {
  title: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type CatalogProduct = {
  id: string;
  sku: string;
  /** Catalog list price before automatic discount. */
  listPriceAmount: number;
  /** Customer-facing unit price after automatic discount. */
  priceAmount: number;
  compareAtAmount: number | null;
  discountPercent: number | null;
  stockOnHand: number;
  isSpicy: boolean;
  isVegetarian: boolean;
  translation: LocaleTranslation;
  imageUrl: string | null;
};

export type ProductGalleryImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type ProductCategoryRef = {
  id: string;
  title: string;
  slug: string;
};

export type ProductDetail = CatalogProduct & {
  images: ProductGalleryImage[];
  categories: ProductCategoryRef[];
  additions: Array<{ id: string; label: string; priceAmount: number }>;
  exclusions: Array<{ id: string; label: string }>;
};
