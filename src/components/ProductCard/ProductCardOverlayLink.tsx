'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';

export type ProductCardOverlayLinkProps = {
  slug: string;
  /** Accessible name when the card has no visible title link. */
  label: string;
  className?: string;
};

/**
 * Full-card PDP link — render as the **last** child of the card so it sits above
 * inert content; action buttons use {@link PRODUCT_CARD_INTERACTIVE_Z_CLASS}.
 */
export function ProductCardOverlayLink({ slug, label, className = '' }: ProductCardOverlayLinkProps) {
  return (
    <ProductPageLink
      slug={slug}
      className={[
        'absolute inset-0 z-[1] rounded-[inherit]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F66812]',
        className,
      ].join(' ')}
      aria-label={label}
    />
  );
}
