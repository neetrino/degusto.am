'use client';

import Link from 'next/link';

export type StorefrontProductOverlayLinkProps = {
  href: string;
  label: string;
  className?: string;
};

/** Stretched link for Figma/mobile product cards with overlay action buttons. */
export function StorefrontProductOverlayLink({
  href,
  label,
  className = '',
}: StorefrontProductOverlayLinkProps) {
  return (
    <Link
      href={href}
      className={[
        'absolute inset-0 z-[1] rounded-[inherit]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]',
        className,
      ].join(' ')}
      aria-label={label}
    />
  );
}
