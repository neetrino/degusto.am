import Link from 'next/link';
import type { ComponentProps } from 'react';

import { HEADER_PUBLIC_ASSETS } from '@/constants/header-public-assets';

export type BrandLogoLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'children'> & {
  /** Icon-sized mark for narrow sidebars (e.g. admin rail). */
  compact?: boolean;
  /** Use high-contrast styling on dark backgrounds. */
  onDark?: boolean;
};

export function BrandLogoLink({ className = '', compact = false, onDark = false, ...rest }: BrandLogoLinkProps) {
  if (compact) {
    return (
      <Link
        href="/"
        title="Degusto"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md font-bold leading-none transition-colors ${
          onDark
            ? 'bg-white text-lg font-extrabold !text-[#f66812] hover:bg-[#fff2e8]'
            : 'bg-gray-900 text-[0.65rem] tracking-tight text-white hover:bg-gray-800'
        } ${className}`}
        style={onDark ? { color: '#f66812' } : undefined}
        {...rest}
      >
        {onDark ? 'D' : 'DG'}
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`group flex flex-shrink-0 items-center ${className}`}
      {...rest}
    >
      {onDark ? (
        <img
          src={HEADER_PUBLIC_ASSETS.logo}
          alt="Degusto"
          className="h-12 w-[134px] max-w-full object-contain"
        />
      ) : (
        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold text-transparent transition-all duration-300 group-hover:from-gray-800 group-hover:to-gray-600 sm:text-2xl">
          Degusto
        </span>
      )}
    </Link>
  );
}
