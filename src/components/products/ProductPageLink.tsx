'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { buildProductPageHref } from '@/lib/products/build-product-page-href';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import { beginPdpNavigationMetric } from '@/lib/products/pdp-progressive-metrics';
import {
  setProductSummarySnapshot,
  type ProductSummarySnapshot,
} from '@/lib/products/product-summary-cache';

export type ProductPageLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  slug: string;
  children?: ReactNode;
  preview?: Omit<ProductSummarySnapshot, 'updatedAt'> | null;
};

/**
 * Client-side PDP navigation: Next.js Link + route/visual prefetch on hover/focus.
 */
export function ProductPageLink({
  slug,
  children,
  preview = null,
  onMouseEnter,
  onFocus,
  onPointerDown,
  onTouchStart,
  onClick,
  ...rest
}: ProductPageLinkProps) {
  const router = useRouter();
  const href = buildProductPageHref(slug);

  const registerPreview = () => {
    if (!preview) {
      return;
    }
    setProductSummarySnapshot(preview);
  };

  const warm = () => {
    registerPreview();
    prefetchProductRoute(router, slug);
  };

  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={(event) => {
        warm();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warm();
        onFocus?.(event);
      }}
      onPointerDown={(event) => {
        warm();
        beginPdpNavigationMetric(slug);
        onPointerDown?.(event);
      }}
      onTouchStart={(event) => {
        warm();
        beginPdpNavigationMetric(slug);
        onTouchStart?.(event);
      }}
      onClick={(event) => {
        registerPreview();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}

export { buildProductPageHref };
