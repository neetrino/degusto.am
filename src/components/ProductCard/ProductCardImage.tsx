"use client";

import Image from "next/image";
import { ProductLabels } from "../ProductLabels";
import { resolveStorefrontProductImage } from "@/constants/storefront-product-image";
import type { ProductLabel } from "../ProductLabels";

interface ProductCardImageProps {
  image: string | null;
  title: string;
  labels?: ProductLabel[];
  imageError: boolean;
  onImageError: () => void;
  isCompact?: boolean;
}

/**
 * Component for displaying product image with labels.
 */
export function ProductCardImage({
  image,
  title,
  labels,
  imageError,
  onImageError,
  isCompact = false,
}: ProductCardImageProps) {
  void isCompact;
  const displaySrc = imageError ? resolveStorefrontProductImage(null) : resolveStorefrontProductImage(image);

  return (
    <div data-product-fly-origin className="aspect-square bg-gray-100 relative overflow-hidden">
      <Image
        src={displaySrc}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        unoptimized
        onError={onImageError}
      />
      {labels && labels.length > 0 && <ProductLabels labels={labels} />}
    </div>
  );
}




