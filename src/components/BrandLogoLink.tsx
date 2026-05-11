import Link from 'next/link';
import type { ComponentProps } from 'react';

export type BrandLogoLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'children'> & {
  /** Icon-sized mark for narrow sidebars (e.g. admin rail). */
  compact?: boolean;
};

export function BrandLogoLink({ className = '', compact = false, ...rest }: BrandLogoLinkProps) {
  if (compact) {
    return (
      <Link
        href="/"
        title="White-Shop"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-gray-900 text-[0.65rem] font-bold leading-none tracking-tight text-white transition-colors hover:bg-gray-800 ${className}`}
        {...rest}
      >
        WS
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`group flex flex-shrink-0 items-center ${className}`}
      {...rest}
    >
      <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent transition-all duration-300 group-hover:from-gray-800 group-hover:to-gray-600 sm:text-2xl">
        White-Shop
      </span>
    </Link>
  );
}
