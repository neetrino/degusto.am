'use client';

import Image from 'next/image';
import { useEffect, useState, type ComponentProps } from 'react';

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
  fallbackSrc?: string;
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
  fallbackSrc,
  onError,
}: HomeOptimizedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    setResolvedSrc(src);
  }, [src]);

  const handleError: ComponentProps<typeof Image>['onError'] = (event) => {
    onError?.(event);
    if (fallbackSrc && resolvedSrc !== fallbackSrc) {
      setResolvedSrc(fallbackSrc);
    }
  };

  if (!resolvedSrc) {
    return null;
  }

  if (isSvgAsset(resolvedSrc)) {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={handleError}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? '100vw'}
        priority={priority}
        loading={loading}
        unoptimized={IS_DEV_UNOPTIMIZED}
        onError={handleError}
      />
    );
  }

  if (typeof width !== 'number' || typeof height !== 'number') {
    return (
      <img
        src={resolvedSrc}
        alt={alt}
        className={className}
        loading={loading}
        decoding="async"
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
      unoptimized={IS_DEV_UNOPTIMIZED}
      onError={handleError}
    />
  );
}
