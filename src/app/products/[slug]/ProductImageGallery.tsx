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

  // Show only 3 thumbnails at a time, scrollable with navigation arrows
  const visibleThumbnails = images.slice(thumbnailStartIndex, thumbnailStartIndex + THUMBNAILS_PER_VIEW);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <div
            data-product-fly-origin
            className="group relative aspect-[6/5] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            {images.length > 0 && !mainImageFailed ? (
              <Image
                src={currentSrc}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
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

        <div className="flex items-center gap-2">
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
              className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={t(language, 'common.ariaLabels.previousThumbnail')}
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="flex-1 overflow-hidden">
            <div className="flex gap-3">
            {visibleThumbnails.map((image, index) => {
              const actualIndex = thumbnailStartIndex + index;
              const isActive = actualIndex === currentImageIndex;
              return (
                <button 
                  key={actualIndex}
                  onClick={() => onImageIndexChange(actualIndex)}
                  className={`relative aspect-square w-20 sm:w-24 rounded-xl overflow-hidden border bg-white transition-all duration-300 flex-shrink-0 ${
                    isActive 
                      ? "border-gray-400 shadow-[0_2px_8px_rgba(0,0,0,0.12)] ring-2 ring-neutral-300" 
                      : "border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  {failedIndices.has(actualIndex) ? (
                    <ProductImagePlaceholder className="w-full h-full" aria-label="" />
                  ) : (
                    <img
                      src={image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300"
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
                const newStart = Math.min(images.length - THUMBNAILS_PER_VIEW, thumbnailStartIndex + 1);
                onThumbnailStartIndexChange(newStart);
                if (currentImageIndex > newStart + THUMBNAILS_PER_VIEW - 1) {
                  onImageIndexChange(newStart + THUMBNAILS_PER_VIEW - 1);
                }
              }}
              disabled={thumbnailStartIndex >= images.length - THUMBNAILS_PER_VIEW}
              className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-all duration-200 hover:border-gray-400 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={t(language, 'common.ariaLabels.nextThumbnail')}
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
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
