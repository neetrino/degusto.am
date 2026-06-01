'use client';

import Link from 'next/link';

export type ProductCardOverlayLinkProps = {
  href: string;
  /** Accessible name when the card has no visible title link. */
  label: string;
  className?: string;
};

/**
 * Full-card product navigation behind wishlist/cart controls (stretched link pattern).
 */
export function ProductCardOverlayLink({ href, label, className = '' }: ProductCardOverlayLinkProps) {
  return (
    <Link
      href={href}
      className={[
        'absolute inset-0 z-[1] rounded-[inherit]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F66812]',
        className,
      ].join(' ')}
      aria-label={label}
    />
  );
}
