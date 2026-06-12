'use client';

import type { ReactNode } from 'react';
import { Card } from '@shop/ui';
import { AUTH_PAGE_BACKGROUND_IMAGE_PATH } from '@/constants/auth-page-assets';
import {
  AUTH_PAGE_CARD_CLASS,
  AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS,
  AUTH_PAGE_GLOW_PRIMARY_CLASS,
  AUTH_PAGE_GLOW_SECONDARY_CLASS,
  AUTH_PAGE_MOBILE_CONTENT_CLASS,
  AUTH_PAGE_SHELL_SURFACE_CLASS,
} from '@/constants/auth-page-layout';

type AuthPageShellProps = {
  children: ReactNode;
  contentMaxWidthClass?: string;
};

/**
 * Login/register layout: mobile white sheet via MobileStorefrontChrome; desktop orange hero + card.
 */
export function AuthPageShell({
  children,
  contentMaxWidthClass = 'max-w-[560px]',
}: AuthPageShellProps) {
  return (
    <div
      className={`relative z-20 flex min-h-0 flex-1 flex-col overflow-hidden ${AUTH_PAGE_SHELL_SURFACE_CLASS} ${AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS}`}
    >
      <img
        src={AUTH_PAGE_BACKGROUND_IMAGE_PATH}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full object-cover opacity-100 lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_32%,rgba(255,255,255,0)_100%)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] hidden bg-[radial-gradient(circle_at_50%_46%,rgba(255,220,168,0.16)_0%,rgba(255,220,168,0)_56%)] lg:block"
      />
      <div
        className={`relative z-10 mx-auto flex min-h-0 w-full ${contentMaxWidthClass} ${AUTH_PAGE_MOBILE_CONTENT_CLASS} flex-1 flex-col pb-10 pt-7 px-4 sm:px-6 lg:justify-center lg:px-8 lg:py-12`}
      >
        <div className="relative flex flex-1 flex-col justify-center">
          <div aria-hidden="true" className={`${AUTH_PAGE_GLOW_PRIMARY_CLASS} hidden lg:block`} />
          <div aria-hidden="true" className={`${AUTH_PAGE_GLOW_SECONDARY_CLASS} hidden lg:block`} />
          <Card className={AUTH_PAGE_CARD_CLASS}>{children}</Card>
        </div>
      </div>
    </div>
  );
}
