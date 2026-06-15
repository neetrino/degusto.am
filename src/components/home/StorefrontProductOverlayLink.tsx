'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';
import type { ProductSummarySnapshot } from '@/lib/products/product-summary-cache';

export type StorefrontProductOverlayLinkProps = {
  slug: string;
  label: string;
  className?: string;
  preview?: Omit<ProductSummarySnapshot, 'updatedAt'> | null;
};

/** Stretched PDP link — last child of the card; buttons use z-20. */
export function StorefrontProductOverlayLink({
  slug,
  label,
  className = '',
  preview = null,
}: StorefrontProductOverlayLinkProps) {
  return (
    <ProductPageLink
      slug={slug}
      preview={preview}
      className={[
        'absolute inset-0 z-[1] rounded-[inherit]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]',
        className,
      ].join(' ')}
      aria-label={label}
    />
  );
}
