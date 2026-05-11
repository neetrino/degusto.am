export interface Product {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  featured?: boolean;
  price: number;
  stock: number;
  discountPercent?: number;
  compareAtPrice?: number | null;
  colorStocks?: Array<{
    color: string;
    stock: number;
  }>;
  image: string | null;
  createdAt: string;
  /** Comma-separated category titles (EN locale), primary first */
  categorySummary: string;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  requiresSizes: boolean;
}






