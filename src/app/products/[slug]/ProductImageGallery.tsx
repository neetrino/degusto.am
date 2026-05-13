"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Maximize2 } from "lucide-react";
import { ProductLabels } from "../../../components/ProductLabels";
import { ProductImagePlaceholder } from "../../../components/ProductImagePlaceholder";
import { t } from "../../../lib/i18n";
import type { LanguageCode } from "../../../lib/language";
import type { Product } from "./types";

const PDP_MAIN_IMAGE_SIZES = "(max-width: 1024px) 100vw, 55vw";

interface ProductImageGalleryProps {
  images: string[];
  product: Product;
  discountPercent: number | null;
  language: LanguageCode;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  thumbnailStartIndex: number;
  onThumbnailStartIndexChange: (index: number) => void;
  /** LCP: prioritize only the first above-the-fold hero image. */
  mainImagePriority?: boolean;
}

const THUMBNAILS_PER_VIEW = 5;

export function ProductImageGallery({
  images,
  product,
  discountPercent,
  language,
  currentImageIndex,
  onImageIndexChange,
  thumbnailStartIndex,
  onThumbnailStartIndexChange,
  mainImagePriority = false,
}: ProductImageGalleryProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());

  const markFailed = (index: number) => {
    setFailedIndices((prev) => new Set(prev).add(index));
  };

  const mainImageFailed = failedIndices.has(currentImageIndex);
  const currentSrc = images[currentImageIndex];

  // Auto-scroll thumbnails to show selected image
  useEffect(() => {
    if (images.length > THUMBNAILS_PER_VIEW) {
      if (currentImageIndex < thumbnailStartIndex) {
        // Selected image is above visible range - scroll up
        onThumbnailStartIndexChange(currentImageIndex);
      } else if (currentImageIndex >= thumbnailStartIndex + THUMBNAILS_PER_VIEW) {
        // Selected image is below visible range - scroll down
        onThumbnailStartIndexChange(currentImageIndex - THUMBNAILS_PER_VIEW + 1);
      }
    }
  }, [currentImageIndex, images.length, thumbnailStartIndex, onThumbnailStartIndexChange]);

  /** Visible thumbnail window; arrows scroll when count exceeds `THUMBNAILS_PER_VIEW`. */
  const visibleThumbnails = images.slice(thumbnailStartIndex, thumbnailStartIndex + THUMBNAILS_PER_VIEW);

  const hasMultipleImages = images.length > 1;

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <div className="w-full min-w-0">
          <div
            data-product-fly-origin
            className="group/main relative aspect-[6/5] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            {images.length > 0 && !mainImageFailed ? (
              <Image
                src={currentSrc}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover/main:scale-105"
                sizes={PDP_MAIN_IMAGE_SIZES}
                priority={mainImagePriority}
                unoptimized
                onError={() => markFailed(currentImageIndex)}
              />
            ) : (
              <ProductImagePlaceholder
                className="w-full h-full"
                aria-label={t(language, "common.messages.noImage")}
              />
            )}

            {discountPercent && (
              <div className="absolute top-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                -{discountPercent}%
              </div>
            )}

            {product.labels && <ProductLabels labels={product.labels} />}

            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  className="absolute left-3 top-1/2 z-[11] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-gray-800 opacity-0 transition-opacity duration-200 group-hover/main:opacity-100 focus-visible:opacity-100"
                  aria-label={t(language, 'common.ariaLabels.previousImage')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onImageIndexChange((currentImageIndex - 1 + images.length) % images.length);
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 z-[11] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-white/90 text-gray-800 opacity-0 transition-opacity duration-200 group-hover/main:opacity-100 focus-visible:opacity-100"
                  aria-label={t(language, 'common.ariaLabels.nextImage')}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onImageIndexChange((currentImageIndex + 1) % images.length);
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : null}

            <div className="absolute bottom-4 left-4 flex flex-col gap-3 z-10">
              <button
                onClick={() => setShowZoom(true)}
                className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-white/90 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                aria-label={t(language, 'common.ariaLabels.fullscreenImage')}
              >
                <Maximize2 className="w-5 h-5 text-gray-800" />
              </button>
            </div>
          </div>
        </div>

        {hasMultipleImages ? (
          <div className="group/thumbStrip flex w-full min-w-0 items-center justify-center gap-2">
            {images.length > THUMBNAILS_PER_VIEW && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newStart = Math.max(0, thumbnailStartIndex - 1);
                  onThumbnailStartIndexChange(newStart);
                  if (currentImageIndex < newStart) {
                    onImageIndexChange(newStart);
                  }
                }}
                disabled={thumbnailStartIndex <= 0}
                className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 opacity-0 transition-opacity duration-200 group-hover/thumbStrip:opacity-100 focus-visible:opacity-100 hover:border-gray-400 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={t(language, 'common.ariaLabels.previousThumbnail')}
              >
                <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex max-w-full flex-nowrap justify-center gap-3 overflow-x-auto pb-0.5">
                {visibleThumbnails.map((image, index) => {
                  const actualIndex = thumbnailStartIndex + index;
                  const isActive = actualIndex === currentImageIndex;
                  return (
                    <button
                      key={actualIndex}
                      type="button"
                      onClick={() => onImageIndexChange(actualIndex)}
                      className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all duration-300 sm:w-24 ${
                        isActive
                          ? 'border-orange-500'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {failedIndices.has(actualIndex) ? (
                        <ProductImagePlaceholder className="h-full w-full" aria-label="" />
                      ) : (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={() => markFailed(actualIndex)}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {images.length > THUMBNAILS_PER_VIEW && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newStart = Math.min(
                    images.length - THUMBNAILS_PER_VIEW,
                    thumbnailStartIndex + 1,
                  );
                  onThumbnailStartIndexChange(newStart);
                  if (currentImageIndex > newStart + THUMBNAILS_PER_VIEW - 1) {
                    onImageIndexChange(newStart + THUMBNAILS_PER_VIEW - 1);
                  }
                }}
                disabled={thumbnailStartIndex >= images.length - THUMBNAILS_PER_VIEW}
                className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 opacity-0 transition-opacity duration-200 group-hover/thumbStrip:opacity-100 focus-visible:opacity-100 hover:border-gray-400 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={t(language, 'common.ariaLabels.nextThumbnail')}
              >
                <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        ) : null}
      </div>

      {showZoom && images.length > 0 && !failedIndices.has(currentImageIndex) && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <img src={currentSrc} alt="" className="max-w-full max-h-full object-contain" />
          <button 
            className="absolute top-4 right-4 text-white text-2xl"
            aria-label={t(language, 'common.buttons.close')}
            onClick={(e) => {
              e.stopPropagation();
              setShowZoom(false);
            }}
          >
            {t(language, 'common.buttons.close')}
          </button>
        </div>
      )}
    </>
  );
}
