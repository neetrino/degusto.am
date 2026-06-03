'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { buildProductPageHref } from '@/lib/products/build-product-page-href';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';

export type ProductPageLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'> & {
  slug: string;
  children?: ReactNode;
};

/**
 * Client-side PDP navigation: Next.js Link + route/visual prefetch on hover/focus.
 */
export function ProductPageLink({
  slug,
  children,
  onMouseEnter,
  onFocus,
  ...rest
}: ProductPageLinkProps) {
  const router = useRouter();
  const href = buildProductPageHref(slug);

  const warm = () => {
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
      {...rest}
    >
      {children}
    </Link>
  );
}

export { buildProductPageHref };
