'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { PDP_FIGMA_PILL_BG, PDP_PILL_RADIUS_CLASS } from '@/constants/pdp-figma-tokens';

export type PdpSecondaryIconButtonProps = {
  children: ReactNode;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label' | 'title' | 'disabled'>;

/** Figma nodes 10:2279 / 10:1942 — gray pill icon action. */
export function PdpSecondaryIconButton({
  children,
  onClick,
  'aria-label': ariaLabel,
  title,
  disabled,
}: PdpSecondaryIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden ${PDP_PILL_RADIUS_CLASS} transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
      style={{ backgroundColor: PDP_FIGMA_PILL_BG }}
    >
      {children}
    </button>
  );
}
