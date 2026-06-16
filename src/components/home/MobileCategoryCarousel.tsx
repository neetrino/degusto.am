'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StorefrontCategoryLink } from '../routing/StorefrontCategoryLink';
import { getHomeCategoryHref } from './homeCategoryLinks';
import { HomeOptimizedImage } from './HomeOptimizedImage';

export type MobileCategoryCarouselItem = {
  id: string;
  slug: string;
  title: string;
  image: string;
  framed?: boolean;
};

type MobileCategoryCarouselProps = {
  categories: MobileCategoryCarouselItem[];
  frameImageSrc: string;
};

type CarouselMetrics = {
  pageCount: number;
  activePage: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function MobileCategoryCarousel({ categories, frameImageSrc }: MobileCategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<CarouselMetrics>({ pageCount: 1, activePage: 0 });

  const updateMetrics = useCallback(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const viewportWidth = node.clientWidth;
    if (viewportWidth <= 0) {
      setMetrics({ pageCount: 1, activePage: 0 });
      return;
    }

    const maxScrollLeft = Math.max(0, node.scrollWidth - viewportWidth);
    const pageCount = Math.max(1, Math.ceil(maxScrollLeft / viewportWidth) + 1);
    const activePage =
      pageCount <= 1 || maxScrollLeft <= 0
        ? 0
        : clamp(
            Math.round((node.scrollLeft / maxScrollLeft) * (pageCount - 1)),
            0,
            pageCount - 1,
          );
    setMetrics({ pageCount, activePage });
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    updateMetrics();
    const handleScroll = () => {
      updateMetrics();
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateMetrics);

    return () => {
      node.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMetrics);
    };
  }, [updateMetrics]);

  const dots = useMemo(() => Array.from({ length: metrics.pageCount }), [metrics.pageCount]);

  return (
    <>
      <div ref={containerRef} className="-mx-3 overflow-x-auto px-3 pb-1 scrollbar-hide">
        <div className="flex w-max items-start gap-2">
          {categories.map((category) => (
            <StorefrontCategoryLink
              key={category.id}
              href={getHomeCategoryHref({ slug: category.slug, title: category.title })}
              className="w-[56px] shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
              aria-label={category.title}
            >
              <div className="relative mx-auto flex h-[72px] w-[48px] items-center justify-center rounded-[24px] bg-[#090909]">
                {category.framed ? (
                  <HomeOptimizedImage
                    src={frameImageSrc}
                    alt=""
                    width={48}
                    height={72}
                    className="absolute inset-0 h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : null}
                <HomeOptimizedImage
                  src={category.image}
                  alt={category.title}
                  width={40}
                  height={42}
                  className="relative h-[42px] w-[40px] rounded-[10px] object-cover"
                  loading="lazy"
                  sizes="48px"
                />
              </div>
              <p className="mt-[6px] text-center text-xs leading-5 text-black">{category.title}</p>
            </StorefrontCategoryLink>
          ))}
        </div>
      </div>
      <div className="pt-1">
        <div className="flex items-center justify-center gap-1">
          {dots.map((_, index) => (
            <button
              key={`mobile-category-dot-${index}`}
              type="button"
              onClick={() => {
                const node = containerRef.current;
                if (!node) {
                  return;
                }
                node.scrollTo({ left: node.clientWidth * index, behavior: 'smooth' });
              }}
              className={`h-1 w-5 rounded-[12px] transition-colors ${
                index === metrics.activePage ? 'bg-[#ff7f20]' : 'bg-[#ffeacc]'
              }`}
              aria-label={`Go to category page ${index + 1}`}
              aria-current={index === metrics.activePage ? 'true' : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}
