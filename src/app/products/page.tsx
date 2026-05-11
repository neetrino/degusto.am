import { Suspense } from 'react';
import { CategoryNavigation } from '../../components/CategoryNavigation';
import { ProductsCatalog } from './ProductsCatalog';
import { ProductsCatalogSkeleton } from './ProductsCatalogSkeleton';

/**
 * Shop catalog: category strip streams immediately; product grid streams inside Suspense.
 */
export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="w-full max-w-full">
      <CategoryNavigation />
      <Suspense fallback={<ProductsCatalogSkeleton />}>
        <ProductsCatalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
