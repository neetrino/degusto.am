'use client';

import Image from 'next/image';
import type { ComponentProps } from 'react';

const IS_DEV_UNOPTIMIZED = process.env.NODE_ENV === 'development';

type HomeOptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onError?: ComponentProps<typeof Image>['onError'];
};

function isSvgAsset(src: string): boolean {
  return /\.svg($|[?#])/i.test(src);
}

/**
 * Home storefront image: Next.js optimizer (WebP/AVIF in production), plain img for SVG icons.
 */
export function HomeOptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  loading,
  onError,
}: HomeOptimizedImageProps) {
  if (!src) {
    return null;
  }

  if (isSvgAsset(src)) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={onError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? '100vw'}
        priority={priority}
        loading={loading}
        unoptimized={IS_DEV_UNOPTIMIZED}
        onError={onError}
      />
    );
  }

  if (typeof width !== 'number' || typeof height !== 'number') {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
      unoptimized={IS_DEV_UNOPTIMIZED}
      onError={onError}
    />
  );
}
