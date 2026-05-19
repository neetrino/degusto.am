"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductLabels } from "../ProductLabels";
import { STOREFRONT_PRODUCT_IMAGE_PATH } from "@/constants/storefront-product-image";
import type { ProductLabel } from "../ProductLabels";

interface ProductCardImageProps {
  slug: string;
  image: string | null;
  title: string;
  labels?: ProductLabel[];
  imageError: boolean;
  onImageError: () => void;
  isCompact?: boolean;
}

/**
 * Component for displaying product image with labels.
 * Uses the shared storefront product photo for every product card.
 */
export function ProductCardImage({
  slug,
  image,
  title,
  labels,
  imageError,
  onImageError,
  isCompact = false,
}: ProductCardImageProps) {
  void image;
  void imageError;
  const displaySrc = STOREFRONT_PRODUCT_IMAGE_PATH;

  return (
    <div data-product-fly-origin className="aspect-square bg-gray-100 relative overflow-hidden">
      <Link href={`/products/${slug}`} className="relative block w-full h-full">
        <Image
          src={displaySrc}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          unoptimized
          onError={onImageError}
        />
      </Link>
      {labels && labels.length > 0 && <ProductLabels labels={labels} />}
    </div>
  );
}




