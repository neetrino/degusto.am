'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HomeFeaturedProduct } from './home-page-types';
import { MobileHomeDailyOffer } from './MobileHomeDailyOffer';

type MobileDailyOfferCarouselProps = {
  products: HomeFeaturedProduct[];
  dailyOfferAddToCartSrc: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function MobileDailyOfferCarousel({
  products,
  dailyOfferAddToCartSrc,
}: MobileDailyOfferCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(Math.max(1, products.length));
  const [activePage, setActivePage] = useState(0);

  const updateMetrics = useCallback(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const viewportWidth = node.clientWidth;
    if (viewportWidth <= 0) {
      setPageCount(1);
      setActivePage(0);
      return;
    }

    const nextPageCount = Math.max(1, products.length);
    const nextActivePage = clamp(Math.round(node.scrollLeft / viewportWidth), 0, nextPageCount - 1);
    setPageCount(nextPageCount);
    setActivePage(nextActivePage);
  }, [products.length]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    updateMetrics();
    node.addEventListener('scroll', updateMetrics, { passive: true });
    window.addEventListener('resize', updateMetrics);

    return () => {
      node.removeEventListener('scroll', updateMetrics);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [updateMetrics]);

  const dots = useMemo(() => Array.from({ length: pageCount }), [pageCount]);

  return (
    <>
      <div ref={containerRef} className="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        <div className="flex items-start">
          {products.map((product) => (
            <div key={product.id} className="w-full shrink-0 snap-start px-3">
              <MobileHomeDailyOffer product={product} dailyOfferAddToCartSrc={dailyOfferAddToCartSrc} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[19px] px-3">
        <div className="flex items-center justify-center gap-1">
          {dots.map((_, index) => (
            <button
              key={`daily-offer-dot-${index}`}
              type="button"
              onClick={() => {
                const node = containerRef.current;
                if (!node) {
                  return;
                }
                node.scrollTo({ left: node.clientWidth * index, behavior: 'smooth' });
              }}
              className={`h-1 w-5 rounded-[12px] transition-colors ${
                index === activePage ? 'bg-[#ff7f20]' : 'bg-[#ffeacc]'
              }`}
              aria-label={`Go to daily offer page ${index + 1}`}
              aria-current={index === activePage ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}
