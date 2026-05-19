'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type ViewMoreButtonSize = 'md' | 'lg';
type ViewMoreButtonVariant = 'filled' | 'text';

export type ViewMoreButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  size?: ViewMoreButtonSize;
  variant?: ViewMoreButtonVariant;
};

const FILLED_SIZE_CLASS: Record<ViewMoreButtonSize, string> = {
  md: 'px-4 py-2.5 text-sm sm:px-6 sm:py-3 sm:text-base',
  lg: 'px-6 py-4 text-lg',
};

const TEXT_SIZE_CLASS: Record<ViewMoreButtonSize, string> = {
  md: 'text-base leading-6',
  lg: 'text-base leading-6',
};

/** Dark fill sweeps left → right; scale avoids orange bleed on pill edges */
const FILL_SWEEP_CLASS =
  'pointer-events-none absolute inset-0 rounded-full bg-[#2a2a2a] origin-left scale-x-0 transition-transform duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-x-100 motion-reduce:transition-none motion-reduce:group-hover:scale-x-100';

const LABEL_HOVER_CLASS = 'relative z-10 text-inherit transition-colors duration-300 group-hover:text-[#ff7f20]';

/**
 * “Ավելին” / view-more CTA with gray sweep fill and orange label on hover.
 */
export function ViewMoreButton({
  href,
  children,
  className = '',
  size = 'md',
  variant = 'filled',
}: ViewMoreButtonProps) {
  const isFilled = variant === 'filled';

  return (
    <Link
      href={href}
      className={[
        'group relative inline-flex items-center justify-center overflow-hidden rounded-full font-bold',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7f20]',
        isFilled
          ? `bg-[#ff7f20] text-white transition-[background-color] duration-[550ms] group-hover:bg-[#2a2a2a] ${FILLED_SIZE_CLASS[size]}`
          : `text-[#f66a13] px-2 py-1 transition-[background-color] duration-[550ms] group-hover:bg-[#2a2a2a] ${TEXT_SIZE_CLASS[size]}`,
        className,
      ].join(' ')}
    >
      <span aria-hidden className={FILL_SWEEP_CLASS} />
      <span className={LABEL_HOVER_CLASS}>{children}</span>
    </Link>
  );
}
