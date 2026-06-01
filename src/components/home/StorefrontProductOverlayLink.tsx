'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';

export type StorefrontProductOverlayLinkProps = {
  slug: string;
  label: string;
  className?: string;
};

/** Stretched Next.js Link for Figma/mobile product cards (overlay action buttons). */
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
