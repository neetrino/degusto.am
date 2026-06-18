'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { FigmaHomePage } from './FigmaHomePage';
import type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';

type HomePageResponsiveShellProps = {
  initialIsMobile: boolean;
  mobile: ReactNode;
  categories: HomeCategoryItem[];
  featuredProducts: HomeFeaturedProduct[];
  dailyOfferProduct?: HomeFeaturedProduct | null;
};

/**
 * Renders a single home layout tree (mobile or desktop) to avoid mounting both client shells.
 */
export function HomePageResponsiveShell({
  initialIsMobile,
  mobile,
  categories,
  featuredProducts,
  dailyOfferProduct,
}: HomePageResponsiveShellProps) {
  const viewportIsMobile = useIsMobileViewport();
  const [showMobile, setShowMobile] = useState(initialIsMobile);

  useEffect(() => {
    setShowMobile(viewportIsMobile);
  }, [viewportIsMobile]);

  if (showMobile) {
    return mobile;
  }

  return (
    <FigmaHomePage
      categories={categories}
      featuredProducts={featuredProducts}
      dailyOfferProduct={dailyOfferProduct}
    />
  );
}
