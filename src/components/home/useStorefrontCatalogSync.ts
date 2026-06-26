'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { subscribeStorefrontCatalogUpdated } from '@/lib/storefront/storefront-catalog-events';

/** Refreshes storefront RSC data when admin mutates the product catalog. */
export function useStorefrontCatalogSync(): void {
  const router = useRouter();

  useEffect(() => subscribeStorefrontCatalogUpdated(() => {
    router.refresh();
  }), [router]);
}
