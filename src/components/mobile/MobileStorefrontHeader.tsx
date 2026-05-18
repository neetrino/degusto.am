'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageCurrencySwitcher } from '../LanguageCurrencySwitcher';
import { useTranslation } from '../../lib/i18n-client';
import { SITE_CONTACT_PHONES } from '../../lib/site-contact';
import {
  MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS,
  MOBILE_FIGMA_HEADER_STACKING_CLASS,
  MOBILE_FIGMA_STOREFRONT_ASSETS,
  MOBILE_STOREFRONT_FILTERS_ANCHOR_ID,
} from '@/constants/mobile-figma-storefront';
import { MobileStorefrontHeaderSearch } from './MobileStorefrontHeaderSearch';

function MobileStorefrontSearchSkeleton() {
  return (
    <div
      className="relative z-10 mt-[8px] h-12 translate-y-[20px] rounded-[30px] bg-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]"
      aria-hidden
    />
  );
}

/**
 * Mobile-only Figma header (matches home mobile): logo, call, language, search + filter.
 */
export function MobileStorefrontHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const primaryPhone = SITE_CONTACT_PHONES[0];

  const handleFilterClick = () => {
    if (pathname === '/shop' || pathname?.startsWith('/shop/')) {
      document.getElementById(MOBILE_STOREFRONT_FILTERS_ANCHOR_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }
    if (pathname === '/combo' || pathname?.startsWith('/combo/')) {
      document.getElementById(MOBILE_STOREFRONT_FILTERS_ANCHOR_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      return;
    }
    router.push('/shop');
  };

  return (
    <header
      className={`relative ${MOBILE_FIGMA_HEADER_STACKING_CLASS} ${MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS} shrink-0 pt-[58px] lg:hidden`}
    >
      <div className="relative z-30 flex translate-y-[20px] items-start justify-between">
        <Link href="/" className="inline-flex shrink-0" aria-label={t('common.navigation.home')}>
          <img
            src={MOBILE_FIGMA_STOREFRONT_ASSETS.logo}
            alt="Degusto"
            className="h-[46px] w-[129px] object-contain"
          />
        </Link>
        <div className="flex items-center gap-1">
          <a
            href={`tel:${primaryPhone.tel}`}
            className="relative inline-flex h-12 w-12 items-center justify-center"
            aria-label={`Call ${primaryPhone.display}`}
          >
            <img
              src={MOBILE_FIGMA_STOREFRONT_ASSETS.callCircle}
              alt=""
              className="absolute inset-0 h-12 w-12 object-contain"
            />
            <img
              src={MOBILE_FIGMA_STOREFRONT_ASSETS.callIcon}
              alt=""
              className="relative h-[23px] w-[23px] object-contain"
            />
          </a>
          <LanguageCurrencySwitcher
            variant="mobile"
            iconSrc={MOBILE_FIGMA_STOREFRONT_ASSETS.switcherIcon}
          />
        </div>
      </div>

      <Suspense fallback={<MobileStorefrontSearchSkeleton />}>
        <MobileStorefrontHeaderSearch onFilterClick={handleFilterClick} />
      </Suspense>
    </header>
  );
}
