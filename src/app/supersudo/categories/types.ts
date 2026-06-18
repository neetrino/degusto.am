export interface Category {
  id: string;
  slug: string;
  title: string;
  parentId: string | null;
  productsCount?: number;
  position?: number;
  requiresSizes?: boolean;
  imageUrl?: string | null;
  published?: boolean;
  children?: Category[];
}

export interface CategoryWithLevel extends Category {
  level: number;
}

export interface CategoryFormData {
  titleHy: string;
  titleEn: string;
  titleRu: string;
  requiresSizes: boolean;
  imageUrl: string;
  published: 'published' | 'draft';
}

export interface CategoryDetails extends Category {
  translations?: Partial<Record<'hy' | 'en' | 'ru', string>>;
}




