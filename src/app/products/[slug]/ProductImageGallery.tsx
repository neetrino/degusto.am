"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { ProductLabels } from "../../../components/ProductLabels";
import { resolveStorefrontProductImage } from "@/constants/storefront-product-image";
import { PDP_PRODUCT_IMAGE_ZOOM_STACKING_CLASS } from "@/constants/ui-stacking";
import { t } from "../../../lib/i18n";
import {
  PDP_IMAGE_DISCOUNT_BADGE_CLASS,
  PDP_IMAGE_RADIUS_CLASS,
  PDP_MAIN_IMAGE_ASPECT_CLASS,
  PDP_MAIN_IMAGE_MAX_WIDTH_CLASS,
  PDP_PILL_RADIUS_CLASS,
} from '@/constants/pdp-figma-tokens';
import type { LanguageCode } from "../../../lib/language";
import type { Product } from "./types";

const PDP_MAIN_IMAGE_SIZES = '(max-width: 1024px) 100vw, 47.5625rem';
const PDP_ZOOM_IMAGE_OFFSET_CLASS = "translate-y-8";

interface ProductImageGalleryProps {
  images: string[];
  product: Product;
  discountPercent: number | null;
  language: LanguageCode;
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  thumbnailStartIndex: number;
  onThumbnailStartIndexChange: (index: number) => void;
  mainImagePriority?: boolean;
}

export function ProductImageGallery({
  images,
  product,
  discountPercent,
  language,
  currentImageIndex,
  mainImagePriority = false,
}: ProductImageGalleryProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPortalTarget, setZoomPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setZoomPortalTarget(document.body);
  }, []);

  const mainImageSrc = resolveStorefrontProductImage(
    images[currentImageIndex] ?? images[0] ?? null
  );

  return (
    <>
      <div className="flex w-full flex-col gap-4">
        <div className={`w-full min-w-0 ${PDP_MAIN_IMAGE_MAX_WIDTH_CLASS}`}>
          <div
            data-product-fly-origin
            className={`group/main relative w-full overflow-hidden bg-neutral-50 ${PDP_MAIN_IMAGE_ASPECT_CLASS} ${PDP_IMAGE_RADIUS_CLASS}`}
          >
            <Image
              src={mainImageSrc}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover/main:scale-105"
              sizes={PDP_MAIN_IMAGE_SIZES}
              priority={mainImagePriority}
              unoptimized
            />

            {discountPercent != null && discountPercent > 0 ? (
              <div className={PDP_IMAGE_DISCOUNT_BADGE_CLASS}>-{discountPercent}%</div>
            ) : null}

            {product.labels ? <ProductLabels labels={product.labels} /> : null}

            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowZoom(true)}
                className={`flex h-12 w-12 items-center justify-center bg-white transition-opacity hover:opacity-90 ${PDP_PILL_RADIUS_CLASS}`}
                aria-label={t(language, 'common.ariaLabels.fullscreenImage')}
              >
                <Maximize2 className="h-5 w-5 text-gray-800" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showZoom && zoomPortalTarget
        ? createPortal(
            <div
              className={`fixed inset-0 ${PDP_PRODUCT_IMAGE_ZOOM_STACKING_CLASS} flex items-center justify-center bg-black/90 p-4`}
              role="dialog"
              aria-modal="true"
              aria-label={t(language, 'common.ariaLabels.fullscreenImage')}
              onClick={() => setShowZoom(false)}
            >
              <img
                src={mainImageSrc}
                alt={product.title}
                className={`max-h-full max-w-full object-contain ${PDP_ZOOM_IMAGE_OFFSET_CLASS}`}
              />
              <button
                type="button"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label={t(language, 'common.buttons.close')}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowZoom(false);
                }}
              >
                <X className="h-7 w-7" strokeWidth={2} aria-hidden />
              </button>
            </div>,
            zoomPortalTarget
          )
        : null}
    </>
  );
}
