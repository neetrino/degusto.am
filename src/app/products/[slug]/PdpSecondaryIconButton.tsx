'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { PDP_SECONDARY_ICON_BUTTON_CLASS } from '@/constants/pdp-figma-tokens';

export type PdpSecondaryIconButtonProps = {
  children: ReactNode;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'aria-label' | 'title' | 'disabled'>;

/** Figma nodes 10:2278 (heart) / 10:1974 (trash) — 48×48 gray pill. */
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
      className={`${PDP_SECONDARY_ICON_BUTTON_CLASS} transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
