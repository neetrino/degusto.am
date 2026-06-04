'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';

export type StorefrontProductOverlayLinkProps = {
  slug: string;
  label: string;
  className?: string;
};

/** Stretched PDP link — last child of the card; buttons use z-20. */
export function StorefrontProductOverlayLink({
  slug,
  label,
  className = '',
}: StorefrontProductOverlayLinkProps) {
  return (
    <ProductPageLink
      slug={slug}
      className={[
        'absolute inset-0 z-[1] rounded-[inherit]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]',
        className,
      ].join(' ')}
      aria-label={label}
    />
  );
}
